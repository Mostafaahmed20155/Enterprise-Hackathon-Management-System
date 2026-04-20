'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { submissionsApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft, FileText, Upload, X, CheckCircle2,
  AlertCircle, Loader2, Paperclip, File as FileIcon,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

interface Team {
  id: string;
  name: string;
  event: { id: string; name: string };
}

interface SelectedFile {
  file: File;
  id: string; // local id for react key
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.zip', '.rar', '.7z', '.gz', '.tar',
  '.mp4', '.mpeg', '.mov', '.avi',
  '.html', '.css', '.js', '.json', '.xml',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const submissionSchema = z.object({
  teamId: z.string().min(1, 'Team is required'),
  titleEn: z.string().min(1, 'English title is required'),
  titleAr: z.string().min(1, 'Arabic title is required'),
  descriptionEn: z.string().min(1, 'English description is required'),
  descriptionAr: z.string().min(1, 'Arabic description is required'),
  demoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  repoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  videoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
  if (['mp4', 'mpeg', 'mov', 'avi'].includes(ext)) return '🎬';
  if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return '📦';
  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '📋';
  return '📎';
}

export default function CreateSubmissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('submissions');
  const locale = useLocale();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { teamId: searchParams.get('teamId') || '' },
  });

  const selectedTeamId = watch('teamId');

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getMyTeams();
      const teamsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setTeams(teamsData);
      const teamIdParam = searchParams.get('teamId');
      if (teamIdParam) setValue('teamId', teamIdParam);
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message;
      const msg = errorMessage && typeof errorMessage === 'object'
        ? (errorMessage[locale] || errorMessage.en || 'Failed to load teams')
        : (errorMessage || 'Failed to load teams');
      toast.error(msg, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  // ── File handling ─────────────────────────────────────────────────────────

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const valid: SelectedFile[] = [];
    const errors: string[] = [];

    for (const file of incoming) {
      const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`"${file.name}" — unsupported type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" — exceeds 100 MB limit`);
        continue;
      }
      // Deduplicate by name+size
      const duplicate = selectedFiles.some(
        f => f.file.name === file.name && f.file.size === file.size
      );
      if (duplicate) continue;

      valid.push({
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        status: 'pending',
      });
    }

    if (errors.length) toast.error(errors.join('\n'), { duration: 6000 });
    if (valid.length) setSelectedFiles(prev => [...prev, ...valid]);
  };

  const removeFile = (id: string) =>
    setSelectedFiles(prev => prev.filter(f => f.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (data: SubmissionFormData) => {
    const selectedTeam = teams.find(t => t.id === data.teamId);
    if (!selectedTeam) { toast.error('Team not found'); return; }

    setIsSubmitting(true);
    try {
      // 1. Create the submission
      const response = await submissionsApi.create({
        teamId: data.teamId,
        eventId: selectedTeam.event.id,
        title: { en: data.titleEn, ar: data.titleAr },
        description: { en: data.descriptionEn, ar: data.descriptionAr },
        demoUrl: data.demoUrl || undefined,
        repoUrl: data.repoUrl || undefined,
        videoUrl: data.videoUrl || undefined,
      });

      const submissionData = response.data?.data || response.data;
      const submissionId: string = submissionData?.id;

      if (!submissionId) throw new Error('No submission ID returned');

      // 2. Upload files sequentially, updating per-file status
      if (selectedFiles.length > 0) {
        let failedCount = 0;
        for (const sf of selectedFiles) {
          setSelectedFiles(prev =>
            prev.map(f => f.id === sf.id ? { ...f, status: 'uploading' } : f)
          );
          try {
            await submissionsApi.uploadFile(submissionId, sf.file);
            setSelectedFiles(prev =>
              prev.map(f => f.id === sf.id ? { ...f, status: 'done' } : f)
            );
          } catch (uploadErr: any) {
            failedCount++;
            const errData = uploadErr.response?.data;
            const errMsg = errData?.error?.message || errData?.message;
            const msg = errMsg && typeof errMsg === 'object'
              ? (errMsg[locale] || errMsg.en || 'Upload failed')
              : (errMsg || 'Upload failed');
            setSelectedFiles(prev =>
              prev.map(f => f.id === sf.id ? { ...f, status: 'error', error: msg } : f)
            );
          }
        }

        if (failedCount > 0) {
          toast.warning(`Submission created, but ${failedCount} file(s) failed to upload.`, { duration: 6000 });
        } else {
          toast.success('Submission and files uploaded successfully!', { duration: 4000 });
        }
      } else {
        const message = response.data?.message;
        const successMsg = typeof message === 'object'
          ? (message[locale] || message.en || 'Submission created successfully')
          : (message || 'Submission created successfully');
        toast.success(successMsg, { duration: 4000 });
      }

      router.push(`/submissions/${submissionId}`);
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message;
      const errorMsg = errorMessage && typeof errorMessage === 'object'
        ? (errorMessage[locale] || errorMessage.en || t('createError'))
        : (errorMessage || t('createError'));
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / empty states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 mx-auto" />
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">You need to be part of a team to create a submission</p>
          <Link href="/teams"><Button>Browse Teams</Button></Link>
        </div>
      </div>
    );
  }

  const isUploading = isSubmitting && selectedFiles.some(f => f.status === 'uploading');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/submissions" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </Link>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-orange-600 to-amber-900 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6" />
              <h1 className="text-3xl font-bold">{t('createSubmission')}</h1>
            </div>
            <p className="text-orange-50/95 text-lg">Submit your project for the hackathon</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Team Selection */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>{t('teamLabel')}</CardTitle>
            <CardDescription>Select the team for this submission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="teamId">Team *</Label>
              <Select
                value={selectedTeamId}
                onValueChange={(v) => setValue('teamId', v)}
                disabled={isSubmitting || !!searchParams.get('teamId')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} · {team.event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teamId && <p className="text-sm text-red-600 dark:text-red-400">{errors.teamId.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>{t('projectDetails')}</CardTitle>
            <CardDescription>{t('fillBothLanguages')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('projectTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titleEn">{t('titleEn')} *</Label>
                  <Input id="titleEn" {...register('titleEn')} placeholder="Smart City Solution" disabled={isSubmitting} />
                  {errors.titleEn && <p className="text-sm text-red-600 dark:text-red-400">{errors.titleEn.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleAr">{t('titleAr')} *</Label>
                  <Input id="titleAr" {...register('titleAr')} placeholder="حل المدينة الذكية" disabled={isSubmitting} dir="rtl" />
                  {errors.titleAr && <p className="text-sm text-red-600 dark:text-red-400">{errors.titleAr.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('projectDescription')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t('descriptionEn')} *</Label>
                  <Textarea id="descriptionEn" {...register('descriptionEn')} placeholder="Describe your project..." rows={6} disabled={isSubmitting} />
                  {errors.descriptionEn && <p className="text-sm text-red-600 dark:text-red-400">{errors.descriptionEn.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">{t('descriptionAr')} *</Label>
                  <Textarea id="descriptionAr" {...register('descriptionAr')} placeholder="صف مشروعك..." rows={6} disabled={isSubmitting} dir="rtl" />
                  {errors.descriptionAr && <p className="text-sm text-red-600 dark:text-red-400">{errors.descriptionAr.message}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Links */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>{t('projectLinks')}</CardTitle>
            <CardDescription>Add links to your demo, repository, and video ({t('optional')})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demoUrl">{t('demoUrl')}</Label>
              <Input id="demoUrl" type="url" {...register('demoUrl')} placeholder="https://demo.example.com" disabled={isSubmitting} />
              {errors.demoUrl && <p className="text-sm text-red-600 dark:text-red-400">{errors.demoUrl.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="repoUrl">{t('repoUrl')}</Label>
              <Input id="repoUrl" type="url" {...register('repoUrl')} placeholder="https://github.com/user/project" disabled={isSubmitting} />
              {errors.repoUrl && <p className="text-sm text-red-600 dark:text-red-400">{errors.repoUrl.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">{t('videoUrl')}</Label>
              <Input id="videoUrl" type="url" {...register('videoUrl')} placeholder="https://youtube.com/watch?v=..." disabled={isSubmitting} />
              {errors.videoUrl && <p className="text-sm text-red-600 dark:text-red-400">{errors.videoUrl.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* ── File Upload ── */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="w-5 h-5" />
              Attachments
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({t('optional')})</span>
            </CardTitle>
            <CardDescription>
              Upload files with your submission — PDFs, images, archives, code, videos. Max 100 MB per file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${isDragging
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01]'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary/60 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept={ALLOWED_EXTENSIONS.join(',')}
                disabled={isSubmitting}
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
              <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isDragging ? 'Drop files here' : 'Click to browse or drag & drop'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, Word, Excel, PowerPoint, images, ZIP, video, code · Max 100 MB each
              </p>
            </div>

            {/* Selected files list */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedFiles.map((sf) => (
                    <div
                      key={sf.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        sf.status === 'done'
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                          : sf.status === 'error'
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                          : sf.status === 'uploading'
                          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                      }`}
                    >
                      <span className="text-xl shrink-0">{getFileIcon(sf.file.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{sf.file.name}</p>
                        <p className="text-xs text-gray-500">{formatBytes(sf.file.size)}</p>
                        {sf.status === 'error' && sf.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{sf.error}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {sf.status === 'uploading' && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        )}
                        {sf.status === 'done' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {sf.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        {sf.status === 'pending' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(sf.id); }}
                            disabled={isSubmitting}
                            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isUploading
                  ? `Uploading ${selectedFiles.filter(f => f.status === 'done').length + 1}/${selectedFiles.length}…`
                  : 'Creating…'
                }
              </span>
            ) : (
              t('createSubmission')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
