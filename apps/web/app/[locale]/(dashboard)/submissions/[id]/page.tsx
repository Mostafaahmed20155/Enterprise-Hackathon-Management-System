'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { submissionsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trophy, Star, Pencil } from 'lucide-react';

type BilingualText = string | { en: string; ar: string };

interface Submission {
  id: string;
  title: BilingualText;
  description: BilingualText;
  status: string;
  demoUrl?: string;
  repoUrl?: string;
  videoUrl?: string;
  team: {
    id: string;
    name: BilingualText;
  };
  files: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileUrl: string;
  }>;
  // Real API shape: scores array with scores as a JSON map and totalScore
  scores?: Array<{
    judge: {
      id?: string;
      name: string;
    };
    scores?: Record<string, number>;       // API field name
    criteriaScores?: Record<string, number>; // mock field name
    totalScore: number;
    feedback?: {
      en: string;
      ar: string;
    };
    submittedAt?: string;
    createdAt?: string;
  }>;
  averageScore?: number;
  createdAt: string;
  updatedAt: string;
}

function getText(value: BilingualText, locale: string): string {
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  SUBMITTED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  DISQUALIFIED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  WINNER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
};

// Mock data disabled — using real API
const USE_MOCK_DATA = false;

const MOCK_SUBMISSIONS: Record<string, Submission> = {
  '1': {
    id: '1',
    title: 'Smart City Traffic Management System',
    description: `Our Smart City Traffic Management System leverages cutting-edge AI and IoT technologies to revolutionize urban traffic flow. The system uses real-time data from thousands of sensors, cameras, and connected vehicles to predict traffic patterns and dynamically adjust traffic signals.

Key Features:
- Real-time traffic monitoring and prediction
- AI-powered signal optimization
- Mobile app for citizens with live traffic updates
- Integration with public transportation systems
- Emergency vehicle priority routing
- Comprehensive analytics dashboard for city planners

The system has been tested in simulation and shows a potential 35% reduction in average commute times and a 28% decrease in carbon emissions from reduced idling.`,
    status: 'SUBMITTED',
    demoUrl: 'https://smartcity-demo.example.com',
    repoUrl: 'https://github.com/techinnovators/smart-traffic',
    videoUrl: 'https://youtube.com/watch?v=demo123',
    team: {
      id: 'team-1',
      name: 'Tech Innovators',
    },
    files: [
      {
        id: 'file-1',
        fileName: 'Technical_Documentation.pdf',
        fileSize: 2457600,
        fileUrl: '/files/tech-doc.pdf',
      },
      {
        id: 'file-2',
        fileName: 'System_Architecture_Diagram.png',
        fileSize: 856320,
        fileUrl: '/files/architecture.png',
      },
      {
        id: 'file-3',
        fileName: 'Test_Results_Report.xlsx',
        fileSize: 1245184,
        fileUrl: '/files/test-results.xlsx',
      },
    ],
    scores: [
      {
        judge: {
          name: 'Dr. Sarah Ahmed',
        },
        criteriaScores: {
          'Innovation': 90.0,
          'Technical Implementation': 88.0,
          'Business Impact': 87.0,
          'Presentation': 89.0,
        },
        totalScore: 88.7,
        feedback: {
          en: 'Excellent implementation of AI-powered traffic optimization. The integration with existing infrastructure is particularly impressive. The team demonstrated strong technical skills and a clear understanding of urban challenges.',
          ar: 'تنفيذ ممتاز لتحسين حركة المرور بالذكاء الاصطناعي. التكامل مع البنية التحتية الحالية مثير للإعجاب بشكل خاص. أظهر الفريق مهارات تقنية قوية وفهم واضح للتحديات الحضرية.',
        },
        submittedAt: '2026-02-10T14:30:00Z',
      },
      {
        judge: {
          name: 'Prof. Mohammed Ali',
        },
        criteriaScores: {
          'Innovation': 92.0,
          'Technical Implementation': 85.0,
          'Business Impact': 88.0,
          'Presentation': 87.0,
        },
        totalScore: 88.2,
        feedback: {
          en: 'Very innovative approach to traffic management. The predictive analytics component is well-designed. Some concerns about scalability to very large cities, but overall an outstanding solution.',
          ar: 'نهج مبتكر جداً لإدارة حركة المرور. مكون التحليلات التنبؤية مصمم بشكل جيد. بعض المخاوف بشأن قابلية التوسع للمدن الكبيرة جداً، ولكن بشكل عام حل متميز.',
        },
        submittedAt: '2026-02-10T16:45:00Z',
      },
      {
        judge: {
          name: 'Eng. Fatima Hassan',
        },
        criteriaScores: {
          'Innovation': 88.0,
          'Technical Implementation': 90.0,
          'Business Impact': 86.0,
          'Presentation': 91.0,
        },
        totalScore: 88.9,
        feedback: {
          en: 'Strong technical implementation with clean code architecture. The demo was very well-presented and the potential impact on urban mobility is significant. Great work!',
          ar: 'تنفيذ تقني قوي مع بنية كود نظيفة. كان العرض التوضيحي مقدماً بشكل جيد جداً والتأثير المحتمل على التنقل الحضري كبير. عمل رائع!',
        },
        submittedAt: '2026-02-11T10:20:00Z',
      },
    ],
    averageScore: 88.6,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-07T15:30:00Z',
  },
  '2': {
    id: '2',
    title: 'Healthcare Analytics Platform',
    description: `Our Healthcare Analytics Platform transforms patient care through advanced machine learning and predictive analytics. By analyzing vast amounts of historical patient data, the platform can predict potential health issues before they become critical, enabling preventive care.

Features:
- Predictive health risk assessment
- Personalized treatment recommendations
- Real-time patient monitoring integration
- HIPAA-compliant data handling
- Interactive physician dashboard
- Patient outcome tracking and analysis

Clinical trials show 42% improvement in early disease detection and 31% reduction in hospital readmissions.`,
    status: 'UNDER_REVIEW',
    demoUrl: 'https://healthanalytics-demo.example.com',
    repoUrl: 'https://github.com/medtechwarriors/health-platform',
    videoUrl: 'https://youtube.com/watch?v=health456',
    team: {
      id: 'team-2',
      name: 'MedTech Warriors',
    },
    files: [
      {
        id: 'file-4',
        fileName: 'Platform_Overview.pdf',
        fileSize: 3145728,
        fileUrl: '/files/platform-overview.pdf',
      },
      {
        id: 'file-5',
        fileName: 'Clinical_Trial_Results.pdf',
        fileSize: 1835008,
        fileUrl: '/files/clinical-trials.pdf',
      },
    ],
    createdAt: '2026-02-02T14:20:00Z',
    updatedAt: '2026-02-08T09:15:00Z',
  },
  '3': {
    id: '3',
    title: 'E-Learning Interactive Platform',
    description: `An innovative e-learning platform that makes education engaging through gamification and interactive content. Students earn points, badges, and unlock achievements while learning, making education fun and motivating.

Core Features:
- Gamified learning paths
- Real-time collaboration tools
- AI-powered personalized learning
- Progress tracking and analytics
- Virtual classrooms with breakout rooms
- Interactive quizzes and assessments
- Peer-to-peer learning communities

Beta testing showed 67% increase in student engagement and 45% improvement in knowledge retention.`,
    status: 'DRAFT',
    demoUrl: 'https://edutech-demo.example.com',
    repoUrl: 'https://github.com/edutechpioneers/elearning',
    team: {
      id: 'team-3',
      name: 'EduTech Pioneers',
    },
    files: [
      {
        id: 'file-6',
        fileName: 'User_Interface_Mockups.pdf',
        fileSize: 4194304,
        fileUrl: '/files/ui-mockups.pdf',
      },
    ],
    createdAt: '2026-02-03T08:45:00Z',
    updatedAt: '2026-02-05T11:20:00Z',
  },
  '4': {
    id: '4',
    title: 'Sustainable Energy Monitor',
    description: `Revolutionary IoT-based system that helps buildings reduce energy consumption through real-time monitoring and intelligent automation. Our system uses machine learning to understand usage patterns and optimize energy usage automatically.

Technical Highlights:
- Network of IoT sensors throughout the building
- Machine learning-based usage prediction
- Automated HVAC and lighting control
- Solar panel integration and optimization
- Real-time energy consumption dashboard
- Mobile app for facility managers
- Cost savings calculator and reports

Field tests demonstrate 40% reduction in energy costs and 52% decrease in carbon footprint.`,
    status: 'WINNER',
    demoUrl: 'https://greenmonitor-demo.example.com',
    repoUrl: 'https://github.com/greencoders/energy-monitor',
    videoUrl: 'https://youtube.com/watch?v=green789',
    team: {
      id: 'team-4',
      name: 'Green Coders',
    },
    files: [
      {
        id: 'file-7',
        fileName: 'Energy_Savings_Report.pdf',
        fileSize: 2621440,
        fileUrl: '/files/savings-report.pdf',
      },
      {
        id: 'file-8',
        fileName: 'IoT_Sensor_Specifications.pdf',
        fileSize: 1048576,
        fileUrl: '/files/sensor-specs.pdf',
      },
      {
        id: 'file-9',
        fileName: 'Installation_Guide.pdf',
        fileSize: 1572864,
        fileUrl: '/files/installation.pdf',
      },
      {
        id: 'file-10',
        fileName: 'Demo_Video_Presentation.mp4',
        fileSize: 15728640,
        fileUrl: '/files/demo-video.mp4',
      },
    ],
    scores: [
      {
        judge: {
          name: 'Dr. Sarah Ahmed',
        },
        criteriaScores: {
          'Innovation': 95.0,
          'Technical Implementation': 92.0,
          'Business Impact': 90.0,
          'Presentation': 93.0,
        },
        totalScore: 92.5,
        feedback: {
          en: 'Outstanding solution with exceptional potential for environmental impact. The IoT integration is seamless and the ML algorithms are well-tuned. This is a winning project that deserves recognition.',
          ar: 'حل متميز بإمكانيات استثنائية للتأثير البيئي. تكامل إنترنت الأشياء سلس وخوارزميات التعلم الآلي محسّنة بشكل جيد. هذا مشروع فائز يستحق التقدير.',
        },
        submittedAt: '2026-02-10T15:00:00Z',
      },
      {
        judge: {
          name: 'Prof. Mohammed Ali',
        },
        criteriaScores: {
          'Innovation': 94.0,
          'Technical Implementation': 93.0,
          'Business Impact': 91.0,
          'Presentation': 92.0,
        },
        totalScore: 92.7,
        feedback: {
          en: 'Brilliant implementation of sustainable technology. The energy savings demonstrated are remarkable and the system is production-ready. Highly impressed with the technical depth and business viability.',
          ar: 'تنفيذ رائع للتكنولوجيا المستدامة. توفير الطاقة المُثبت ملحوظ والنظام جاهز للإنتاج. معجب جداً بالعمق التقني والجدوى التجارية.',
        },
        submittedAt: '2026-02-10T17:30:00Z',
      },
      {
        judge: {
          name: 'Eng. Fatima Hassan',
        },
        criteriaScores: {
          'Innovation': 96.0,
          'Technical Implementation': 91.0,
          'Business Impact': 89.0,
          'Presentation': 94.0,
        },
        totalScore: 92.3,
        feedback: {
          en: 'Exceptional work on all fronts. The system architecture is robust, the presentation was clear and compelling, and the environmental benefits are substantial. This sets a new standard for sustainable tech solutions.',
          ar: 'عمل استثنائي على جميع الجبهات. بنية النظام قوية، والعرض كان واضحاً ومقنعاً، والفوائد البيئية كبيرة. هذا يضع معياراً جديداً لحلول التكنولوجيا المستدامة.',
        },
        submittedAt: '2026-02-11T11:15:00Z',
      },
    ],
    averageScore: 92.5,
    createdAt: '2026-01-28T16:30:00Z',
    updatedAt: '2026-02-08T12:00:00Z',
  },
  '5': {
    id: '5',
    title: 'Blockchain Supply Chain Tracker',
    description: `Transparent and secure supply chain tracking system built on blockchain technology. Every step of the product journey is recorded immutably, ensuring authenticity and preventing counterfeiting.

Key Capabilities:
- Immutable record of product journey
- QR code scanning for product verification
- Real-time location tracking
- Temperature and condition monitoring
- Multi-party verification system
- Smart contract automation
- Consumer-facing transparency portal

Successfully tested with 3 major retailers, showing 99.7% reduction in counterfeit products.`,
    status: 'SUBMITTED',
    demoUrl: 'https://blockchain-supply.example.com',
    repoUrl: 'https://github.com/chainmasters/supply-tracker',
    videoUrl: 'https://youtube.com/watch?v=chain101',
    team: {
      id: 'team-5',
      name: 'Chain Masters',
    },
    files: [
      {
        id: 'file-11',
        fileName: 'Blockchain_Architecture.pdf',
        fileSize: 2097152,
        fileUrl: '/files/blockchain-arch.pdf',
      },
      {
        id: 'file-12',
        fileName: 'Smart_Contract_Code.zip',
        fileSize: 524288,
        fileUrl: '/files/smart-contracts.zip',
      },
    ],
    createdAt: '2026-02-04T13:15:00Z',
    updatedAt: '2026-02-07T18:45:00Z',
  },
  '6': {
    id: '6',
    title: 'AR Shopping Experience',
    description: `Augmented reality mobile application that revolutionizes online shopping by letting customers virtually try products before purchasing. Using advanced 3D modeling and AR technology, customers can see exactly how products look in their space or on their person.

Features:
- Virtual try-on for clothing and accessories
- Furniture placement in real spaces
- 360-degree product visualization
- Social sharing capabilities
- Size and fit recommendations
- One-click purchasing
- Integration with major e-commerce platforms

User testing showed 78% increase in purchase confidence and 65% reduction in product returns.`,
    status: 'DISQUALIFIED',
    demoUrl: 'https://ar-shopping-demo.example.com',
    repoUrl: 'https://github.com/arinnovators/ar-shopping',
    team: {
      id: 'team-6',
      name: 'AR Innovators',
    },
    files: [
      {
        id: 'file-13',
        fileName: 'AR_Technical_Specifications.pdf',
        fileSize: 3670016,
        fileUrl: '/files/ar-specs.pdf',
      },
    ],
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-06T14:30:00Z',
  },
};

export default function SubmissionDetailPage() {
  const params = useParams();
  const t = useTranslations('submissions');
  const locale = useLocale();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submissionId = params.id as string;

  useEffect(() => {
    if (USE_MOCK_DATA && MOCK_SUBMISSIONS[submissionId]) {
      // Use mock data only if the ID matches a known mock submission
      setTimeout(() => {
        setSubmission(MOCK_SUBMISSIONS[submissionId]);
        setIsLoading(false);
      }, 300);
    } else {
      // Fall back to real API for real submission IDs
      loadSubmission();
    }
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setIsLoading(true);
      const response = await submissionsApi.getById(submissionId);
      // API returns submission directly (not wrapped in { data: ... })
      const submission = response.data?.id ? response.data : response.data?.data;
      setSubmission(submission ?? null);
      if (!submission) setError(t('notFound'));
    } catch (err: any) {
      const errData = err.response?.data;
      const msg = errData?.error?.message || errData?.message;
      setError(typeof msg === 'object' ? (msg[locale] || msg.en || t('loadError')) : (msg || t('loadError')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFinal = () => {
    setIsSubmitting(true);

    toast.promise(
      async () => {
        try {
          const response = await submissionsApi.submitFinal(submissionId);
          await loadSubmission();
          return response;
        } finally {
          setIsSubmitting(false);
        }
      },
      {
        loading: t('submitting'),
        success: (data: any) => {
          const message = data?.data?.message;
          return typeof message === 'object'
            ? (message[locale] || message.en || t('submitSuccess'))
            : (message || t('submitSuccess'));
        },
        error: (err: any) => {
          const errorData = err.response?.data;
          const errorMessage = errorData?.error?.message || errorData?.message;
          return errorMessage && typeof errorMessage === 'object'
            ? (errorMessage[locale] || errorMessage.en || t('submitError'))
            : (errorMessage || t('submitError'));
        },
      }
    );
  };

  const handleDeleteFile = async (fileId: string) => {
    toast.promise(
      async () => {
        const response = await submissionsApi.deleteFile(submissionId, fileId);
        await loadSubmission();
        return response;
      },
      {
        loading: t('deleting') || 'Deleting file...',
        success: (data) => {
          const message = data?.data?.message;
          return typeof message === 'object'
            ? (message[locale] || message.en || t('deleteFileSuccess') || 'File deleted successfully')
            : (message || t('deleteFileSuccess') || 'File deleted successfully');
        },
        error: (err: any) => {
          const errorData = err.response?.data;
          const errorMessage = errorData?.error?.message || errorData?.message;
          return errorMessage && typeof errorMessage === 'object'
            ? (errorMessage[locale] || errorMessage.en || t('deleteFileError'))
            : (errorMessage || t('deleteFileError'));
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || t('notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{getText(submission.title, locale)}</h1>
            <p className="text-sm text-gray-500">
              {t('teamLabel')}: {getText(submission.team.name, locale)}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[submission.status]}`}>
            {t(`statuses.${submission.status}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{getText(submission.description, locale)}</p>
            </CardContent>
          </Card>

          {/* Judging Scores */}
          {submission.scores && submission.scores.length > 0 && (
            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle>Judging Scores</CardTitle>
                  </div>
                  {submission.averageScore && (
                    <div className="text-center px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                      <div className="text-3xl font-bold">
                        {submission.averageScore.toFixed(1)}
                      </div>
                      <div className="text-xs opacity-90">Average Score</div>
                    </div>
                  )}
                </div>
                <CardDescription>
                  Scored by {submission.scores.length} {submission.scores.length === 1 ? 'judge' : 'judges'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {submission.scores.map((score, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-6 last:pb-0">
                      {/* Judge Name and Total */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">{score.judge.name}</h4>
                          </div>
                          {(score.submittedAt || score.createdAt) && (
                            <p className="text-sm text-gray-500 ms-6">
                              {new Date(score.submittedAt || score.createdAt!).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        <div className="text-center px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {score.totalScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                        </div>
                      </div>

                      {/* Criteria Scores — supports both mock (criteriaScores) and real API (scores) field names */}
                      {(score.criteriaScores || score.scores) && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {Object.entries(score.criteriaScores ?? score.scores ?? {}).map(([criterion, value]) => (
                            <div key={criterion} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{criterion}</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{(value as number).toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Feedback */}
                      {score.feedback && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Feedback</h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {score.feedback[locale as 'en' | 'ar'] || score.feedback.en}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle>{t('files')} ({submission.files.length})</CardTitle>
              <CardDescription>{t('filesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {submission.files.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('noFiles')}</p>
              ) : (
                <div className="space-y-2">
                  {submission.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-s-3">
                        <span className="text-2xl">📎</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{file.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {(file.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-s-2">
                        <a href={file.fileUrl} download>
                          <Button variant="outline" size="sm">
                            {t('download')}
                          </Button>
                        </a>
                        {submission.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            {t('delete')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle>{t('links')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {submission.demoUrl && (
                <a
                  href={submission.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-s-2 text-indigo-600 hover:text-indigo-500"
                >
                  <span>🌐</span>
                  <span>{t('viewDemo')}</span>
                </a>
              )}
              {submission.repoUrl && (
                <a
                  href={submission.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-s-2 text-indigo-600 hover:text-indigo-500"
                >
                  <span>💻</span>
                  <span>{t('viewRepo')}</span>
                </a>
              )}
              {submission.videoUrl && (
                <a
                  href={submission.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-s-2 text-indigo-600 hover:text-indigo-500"
                >
                  <span>🎥</span>
                  <span>{t('watchVideo')}</span>
                </a>
              )}
              {!submission.demoUrl && !submission.repoUrl && !submission.videoUrl && (
                <p className="text-sm text-gray-500">{t('noLinks')}</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {submission.status === 'DRAFT' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/submissions/${submissionId}/edit`}>
                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    {t('editSubmission')}
                  </Button>
                </Link>
                <Button className="w-full" onClick={handleSubmitFinal} disabled={isSubmitting}>
                  {isSubmitting ? t('submitting') : t('submitFinal')}
                </Button>
                <p className="text-xs text-gray-500">{t('submitWarning')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
