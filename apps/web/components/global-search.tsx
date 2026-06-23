'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { eventsApi, submissionsApi, usersApi } from '@/lib/api';
import { queryKeys } from '@/lib/queries';
import { extractArray, getText, type BilingualText } from '@/lib/utils';

interface SearchEvent {
  id: string;
  name: BilingualText;
  state?: string;
}

interface SearchTeam {
  id: string;
  name: BilingualText;
  event?: { id?: string; name?: BilingualText };
}

interface SearchSubmission {
  id: string;
  title?: BilingualText;
  status?: string;
  team?: { id?: string; name?: BilingualText };
}

interface SearchResult {
  id: string;
  href: string;
  title: string;
  sub: string;
}

interface ResultGroup {
  key: 'events' | 'teams' | 'submissions';
  label: string;
  items: SearchResult[];
}

export function GlobalSearch({ placeholder, shortcut }: { placeholder: string; shortcut: string }) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 220);
    return () => clearTimeout(id);
  }, [query]);

  const enabled = debounced.length >= 2;

  const eventsQuery = useQuery({
    queryKey: queryKeys.events,
    queryFn: () => eventsApi.list().then((r) => r.data),
    enabled,
    staleTime: 60 * 1000,
  });
  const teamsQuery = useQuery({
    queryKey: queryKeys.myTeams,
    queryFn: () => usersApi.getMyTeams().then((r) => r.data),
    enabled,
    staleTime: 60 * 1000,
  });
  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions(50),
    queryFn: () => submissionsApi.list({ limit: 50 }).then((r) => r.data),
    enabled,
    staleTime: 60 * 1000,
  });

  const groups: ResultGroup[] = useMemo(() => {
    if (!enabled) return [];
    const q = debounced.toLowerCase();

    const events: SearchResult[] = extractArray<SearchEvent>(eventsQuery.data)
      .filter((e) => getText(e.name, locale).toLowerCase().includes(q))
      .slice(0, 5)
      .map((e) => ({
        id: `e-${e.id}`,
        href: `/events/${e.id}`,
        title: getText(e.name, locale),
        sub: e.state || '',
      }));

    const teams: SearchResult[] = extractArray<SearchTeam>(teamsQuery.data)
      .filter((tm) => getText(tm.name, locale).toLowerCase().includes(q))
      .slice(0, 5)
      .map((tm) => ({
        id: `t-${tm.id}`,
        href: `/teams/${tm.id}`,
        title: getText(tm.name, locale),
        sub: getText(tm.event?.name, locale),
      }));

    const submissions: SearchResult[] = extractArray<SearchSubmission>(submissionsQuery.data)
      .filter((s) => getText(s.title, locale).toLowerCase().includes(q))
      .slice(0, 5)
      .map((s) => ({
        id: `s-${s.id}`,
        href: `/submissions/${s.id}`,
        title: getText(s.title, locale) || s.id,
        sub: getText(s.team?.name, locale),
      }));

    return [
      { key: 'events' as const, label: t('events'), items: events },
      { key: 'teams' as const, label: t('myTeams'), items: teams },
      { key: 'submissions' as const, label: t('submissions'), items: submissions },
    ].filter((g) => g.items.length > 0);
  }, [enabled, debounced, locale, eventsQuery.data, teamsQuery.data, submissionsQuery.data, t]);

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  const loading =
    enabled && (eventsQuery.isFetching || teamsQuery.isFetching || submissionsQuery.isFetching);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleSelect = () => {
    setQuery('');
    setDebounced('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const showPanel = open && enabled;

  return (
    <div className="ehms-shell-search-wrap" ref={wrapRef}>
      <label className="ehms-shell-search" aria-label={placeholder}>
        <Search aria-hidden size={15} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
        />
        <kbd>{shortcut}</kbd>
      </label>

      {showPanel ? (
        <div className="ehms-shell-search-results" role="listbox">
          {loading ? (
            <div className="ehms-shell-search-empty">
              {locale === 'ar' ? 'جارٍ البحث...' : 'Searching...'}
            </div>
          ) : total === 0 ? (
            <div className="ehms-shell-search-empty">
              {locale === 'ar' ? 'لا توجد نتائج لـ' : 'No results for'} “{debounced}”
            </div>
          ) : (
            groups.map((group) => (
              <div className="ehms-shell-search-group" key={group.key}>
                <div className="ehms-shell-search-group-label">{group.label}</div>
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="ehms-shell-search-item"
                    onClick={handleSelect}
                  >
                    <span className="ehms-shell-search-item-title">{item.title}</span>
                    {item.sub ? (
                      <span className="ehms-shell-search-item-sub">{item.sub}</span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
