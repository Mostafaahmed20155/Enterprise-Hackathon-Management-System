'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { usersApi, judgingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, UserCheck, Search } from 'lucide-react';

interface Judge {
  id: string;
  name: string;
  email: string;
}

interface Criterion {
  nameEn: string;
  nameAr: string;
  weight: number;
  maxScore: number;
}

const DEFAULT_CRITERIA: Criterion[] = [
  { nameEn: 'Innovation',              nameAr: 'الابتكار',         weight: 0.30, maxScore: 100 },
  { nameEn: 'Technical Implementation', nameAr: 'التنفيذ التقني',  weight: 0.30, maxScore: 100 },
  { nameEn: 'Business Impact',          nameAr: 'الأثر التجاري',   weight: 0.20, maxScore: 100 },
  { nameEn: 'Presentation',             nameAr: 'العرض التقديمي',  weight: 0.20, maxScore: 100 },
];

export default function AssignJudgePage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const eventId = params.id as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>(DEFAULT_CRITERIA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all judges on mount
  useEffect(() => {
    loadJudges('');
  }, []);

  const loadJudges = async (q: string) => {
    try {
      setIsSearching(true);
      const response = await usersApi.search({ q: q || undefined, role: 'JUDGE', limit: 50 });
      const data = response.data?.data || response.data;
      setJudges(Array.isArray(data) ? data : []);
    } catch {
      // silently fail, show empty list
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    loadJudges(value);
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const weightOk = Math.abs(totalWeight - 1) < 0.011;

  const updateCriterion = (index: number, field: keyof Criterion, value: string | number) => {
    setCriteria((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const addCriterion = () => {
    setCriteria((prev) => [...prev, { nameEn: '', nameAr: '', weight: 0, maxScore: 100 }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJudge) {
      toast.error(locale === 'ar' ? 'يرجى اختيار حكم' : 'Please select a judge');
      return;
    }

    if (criteria.length === 0) {
      toast.error(locale === 'ar' ? 'أضف معيار تقييم واحد على الأقل' : 'Add at least one criterion');
      return;
    }

    if (!weightOk) {
      toast.error(
        locale === 'ar'
          ? `مجموع الأوزان يجب أن يساوي 1.00 (الحالي: ${totalWeight.toFixed(2)})`
          : `Weights must sum to 1.00 (current: ${totalWeight.toFixed(2)})`
      );
      return;
    }

    const formattedCriteria = criteria.map((c) => ({
      name: { en: c.nameEn, ar: c.nameAr },
      weight: c.weight,
      maxScore: c.maxScore,
    }));

    const promise = judgingApi.createAssignment({
      eventId,
      judgeId: selectedJudge.id,
      criteria: formattedCriteria,
    });

    setIsSubmitting(true);

    toast.promise(promise, {
      loading: locale === 'ar' ? 'جاري تعيين الحكم...' : 'Assigning judge...',
      success: () => {
        router.push(`/events/${eventId}`);
        return locale === 'ar' ? 'تم تعيين الحكم بنجاح' : 'Judge assigned successfully';
      },
      error: (err: any) => {
        const msg = err.response?.data?.error?.message || err.response?.data?.message;
        return typeof msg === 'object'
          ? (msg[locale] || msg.en || (locale === 'ar' ? 'فشل تعيين الحكم' : 'Failed to assign judge'))
          : (msg || (locale === 'ar' ? 'فشل تعيين الحكم' : 'Failed to assign judge'));
      },
    });

    promise.finally(() => setIsSubmitting(false));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {locale === 'ar' ? 'العودة' : 'Back'}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary" />
            {locale === 'ar' ? 'تعيين حكم' : 'Assign Judge'}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {locale === 'ar'
              ? 'اختر حكماً وحدد معايير التقييم'
              : 'Select a judge and define the scoring criteria'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Judge Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'ar' ? 'اختيار الحكم' : 'Select Judge'}</CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'البحث في المستخدمين الذين لديهم دور حكم'
                : 'Search users who have the Judge role'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={locale === 'ar' ? 'ابحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Judge list */}
            {isSearching ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {locale === 'ar' ? 'جاري البحث...' : 'Searching...'}
              </p>
            ) : judges.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {locale === 'ar'
                  ? 'لا يوجد مستخدمون بدور حكم. تأكد من تعيين دور JUDGE للمستخدم أولاً.'
                  : 'No users with the Judge role found. Make sure a user has the JUDGE role first.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {judges.map((judge) => (
                  <div
                    key={judge.id}
                    onClick={() => setSelectedJudge(judge)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedJudge?.id === judge.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center shrink-0">
                      <span className="text-green-800 dark:text-green-300 font-semibold text-sm">
                        {judge.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{judge.name}</p>
                      <p className="text-sm text-gray-500 truncate">{judge.email}</p>
                    </div>
                    {selectedJudge?.id === judge.id && (
                      <UserCheck className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedJudge && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <UserCheck className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  {locale === 'ar' ? 'تم اختيار:' : 'Selected:'}{' '}
                  <strong>{selectedJudge.name}</strong> ({selectedJudge.email})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scoring Criteria */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{locale === 'ar' ? 'معايير التقييم' : 'Scoring Criteria'}</CardTitle>
                <CardDescription>
                  {locale === 'ar'
                    ? 'يجب أن يكون مجموع الأوزان 1.00'
                    : 'Weights must sum to 1.00'}
                </CardDescription>
              </div>
              <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                weightOk
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {locale === 'ar' ? 'المجموع:' : 'Sum:'} {totalWeight.toFixed(2)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {criteria.map((criterion, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {locale === 'ar' ? `المعيار ${index + 1}` : `Criterion ${index + 1}`}
                  </span>
                  {criteria.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriterion(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      {locale === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}
                    </Label>
                    <Input
                      dir="ltr"
                      placeholder="e.g. Innovation"
                      value={criterion.nameEn}
                      onChange={(e) => updateCriterion(index, 'nameEn', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      {locale === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}
                    </Label>
                    <Input
                      dir="rtl"
                      placeholder="مثل: الابتكار"
                      value={criterion.nameAr}
                      onChange={(e) => updateCriterion(index, 'nameAr', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      {locale === 'ar' ? 'الوزن (0-1)' : 'Weight (0–1)'}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={criterion.weight}
                      onChange={(e) => updateCriterion(index, 'weight', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      {locale === 'ar' ? 'أعلى درجة' : 'Max Score'}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={criterion.maxScore}
                      onChange={(e) => updateCriterion(index, 'maxScore', parseInt(e.target.value) || 100)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addCriterion} className="w-full flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {locale === 'ar' ? 'إضافة معيار' : 'Add Criterion'}
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href={`/events/${eventId}`}>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || !selectedJudge || !weightOk}>
            <UserCheck className="w-4 h-4 me-2" />
            {isSubmitting
              ? (locale === 'ar' ? 'جاري التعيين...' : 'Assigning...')
              : (locale === 'ar' ? 'تعيين الحكم' : 'Assign Judge')}
          </Button>
        </div>
      </form>
    </div>
  );
}
