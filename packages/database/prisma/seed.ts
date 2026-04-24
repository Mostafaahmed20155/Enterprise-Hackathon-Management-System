import { PrismaClient, EventState, SubmissionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Bilingual JSON fields */
const loc = (en: string, ar: string) => ({ en, ar });

const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

async function grantOrganizerEventRole(userId: string, eventId: string, roleId: string) {
  const existing = await prisma.userRole.findFirst({
    where: { userId, roleId, eventId },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: { userId, roleId, eventId },
    });
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  console.log('Creating permissions...');

  const permissions = [
    // Event permissions
    { resource: 'EVENT', action: 'CREATE', description: { en: 'Create events', ar: 'إنشاء الفعاليات' } },
    { resource: 'EVENT', action: 'READ', description: { en: 'View events', ar: 'عرض الفعاليات' } },
    { resource: 'EVENT', action: 'UPDATE', description: { en: 'Edit events', ar: 'تعديل الفعاليات' } },
    { resource: 'EVENT', action: 'DELETE', description: { en: 'Delete events', ar: 'حذف الفعاليات' } },
    { resource: 'EVENT', action: 'PUBLISH', description: { en: 'Publish events', ar: 'نشر الفعاليات' } },

    // Team permissions
    { resource: 'TEAM', action: 'CREATE', description: { en: 'Create teams', ar: 'إنشاء الفرق' } },
    { resource: 'TEAM', action: 'READ', description: { en: 'View teams', ar: 'عرض الفرق' } },
    { resource: 'TEAM', action: 'UPDATE', description: { en: 'Edit teams', ar: 'تعديل الفرق' } },
    { resource: 'TEAM', action: 'DELETE', description: { en: 'Delete teams', ar: 'حذف الفرق' } },

    // Submission permissions
    { resource: 'SUBMISSION', action: 'CREATE', description: { en: 'Create submissions', ar: 'إنشاء المشاريع' } },
    { resource: 'SUBMISSION', action: 'READ', description: { en: 'View submissions', ar: 'عرض المشاريع' } },
    { resource: 'SUBMISSION', action: 'UPDATE', description: { en: 'Edit submissions', ar: 'تعديل المشاريع' } },
    { resource: 'SUBMISSION', action: 'DELETE', description: { en: 'Delete submissions', ar: 'حذف المشاريع' } },

    // Judging permissions
    { resource: 'JUDGING', action: 'ASSIGN', description: { en: 'Assign judges', ar: 'تعيين الحكام' } },
    { resource: 'JUDGING', action: 'SCORE', description: { en: 'Submit scores', ar: 'تقديم التقييمات' } },
    { resource: 'JUDGING', action: 'READ', description: { en: 'View scores', ar: 'عرض التقييمات' } },

    // User permissions
    { resource: 'USER', action: 'CREATE', description: { en: 'Create users', ar: 'إنشاء المستخدمين' } },
    { resource: 'USER', action: 'READ', description: { en: 'View users', ar: 'عرض المستخدمين' } },
    { resource: 'USER', action: 'UPDATE', description: { en: 'Edit users', ar: 'تعديل المستخدمين' } },
    { resource: 'USER', action: 'DELETE', description: { en: 'Delete users', ar: 'حذف المستخدمين' } },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm,
    });
  }

  console.log(`✓ Created ${permissions.length} permissions`);

  // ============================================================================
  // ROLES
  // ============================================================================
  console.log('Creating roles...');

  // Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      displayName: { en: 'Super Admin', ar: 'مدير النظام' },
      description: { en: 'Full system access', ar: 'صلاحيات كاملة للنظام' },
    },
  });

  // Organizer Role
  const organizerRole = await prisma.role.upsert({
    where: { name: 'ORGANIZER' },
    update: {},
    create: {
      name: 'ORGANIZER',
      displayName: { en: 'Event Organizer', ar: 'منظم الفعاليات' },
      description: { en: 'Can create and manage events', ar: 'يمكنه إنشاء وإدارة الفعاليات' },
    },
  });

  // Participant Role
  const participantRole = await prisma.role.upsert({
    where: { name: 'PARTICIPANT' },
    update: {},
    create: {
      name: 'PARTICIPANT',
      displayName: { en: 'Participant', ar: 'مشارك' },
      description: { en: 'Can join events and teams', ar: 'يمكنه الانضمام للفعاليات والفرق' },
    },
  });

  // Judge Role
  const judgeRole = await prisma.role.upsert({
    where: { name: 'JUDGE' },
    update: {},
    create: {
      name: 'JUDGE',
      displayName: { en: 'Judge', ar: 'حكم' },
      description: { en: 'Can score submissions', ar: 'يمكنه تقييم المشاريع' },
    },
  });

  console.log('✓ Created 4 roles');

  // ============================================================================
  // ROLE PERMISSIONS
  // ============================================================================
  console.log('Assigning permissions to roles...');

  // Get all permissions
  const allPermissions = await prisma.permission.findMany();

  // Super Admin gets all permissions
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Organizer permissions
  const organizerPermissions = allPermissions.filter(
    (p) =>
      (p.resource === 'EVENT' && ['CREATE', 'READ', 'UPDATE', 'DELETE', 'PUBLISH'].includes(p.action)) ||
      (p.resource === 'TEAM' && ['READ'].includes(p.action)) ||
      (p.resource === 'SUBMISSION' && ['READ'].includes(p.action)) ||
      (p.resource === 'JUDGING' && ['ASSIGN', 'READ'].includes(p.action)) ||
      (p.resource === 'USER' && ['READ'].includes(p.action))
  );

  for (const perm of organizerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: organizerRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: organizerRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Participant permissions
  const participantPermissions = allPermissions.filter(
    (p) =>
      (p.resource === 'EVENT' && ['READ'].includes(p.action)) ||
      (p.resource === 'TEAM' && ['CREATE', 'READ', 'UPDATE', 'DELETE'].includes(p.action)) ||
      (p.resource === 'SUBMISSION' && ['CREATE', 'READ', 'UPDATE', 'DELETE'].includes(p.action)) ||
      (p.resource === 'USER' && ['READ'].includes(p.action))
  );

  for (const perm of participantPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: participantRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: participantRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Judge permissions
  const judgePermissions = allPermissions.filter(
    (p) =>
      (p.resource === 'EVENT' && ['READ'].includes(p.action)) ||
      (p.resource === 'SUBMISSION' && ['READ'].includes(p.action)) ||
      (p.resource === 'JUDGING' && ['SCORE', 'READ'].includes(p.action))
  );

  for (const perm of judgePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: judgeRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: judgeRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log('✓ Assigned permissions to roles');

  // ============================================================================
  // DEMO USERS
  // ============================================================================
  console.log('Creating demo users...');

  const password = await bcrypt.hash('Password123!', 10);

  // Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ehms.com' },
    update: {},
    create: {
      email: 'admin@ehms.com',
      password,
      name: 'System Admin',
      preferredLocale: 'ar',
      emailVerified: true,
    },
  });

  // Assign admin role (use createMany to skip duplicates)
  await prisma.userRole.createMany({
    data: [
      {
        userId: admin.id,
        roleId: superAdminRole.id,
        eventId: null,
      },
    ],
    skipDuplicates: true,
  });

  // Organizer
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@ehms.com' },
    update: { timezone: 'Asia/Riyadh' },
    create: {
      email: 'organizer@ehms.com',
      password,
      name: 'محمد أحمد',
      preferredLocale: 'ar',
      timezone: 'Asia/Riyadh',
      emailVerified: true,
    },
  });

  await prisma.userRole.createMany({
    data: [
      {
        userId: organizer.id,
        roleId: organizerRole.id,
        eventId: null,
      },
    ],
    skipDuplicates: true,
  });

  // Participant 1
  const participant1 = await prisma.user.upsert({
    where: { email: 'participant1@ehms.com' },
    update: { timezone: 'Asia/Riyadh' },
    create: {
      email: 'participant1@ehms.com',
      password,
      name: 'فاطمة علي',
      bio: 'مطورة واجهات أمامية متحمسة',
      preferredLocale: 'ar',
      timezone: 'Asia/Riyadh',
      emailVerified: true,
      skills: [
        { name: { en: 'React', ar: 'React' }, level: 'advanced' },
        { name: { en: 'TypeScript', ar: 'TypeScript' }, level: 'intermediate' },
        { name: { en: 'UI/UX Design', ar: 'تصميم واجهات المستخدم' }, level: 'intermediate' },
      ],
    },
  });

  await prisma.userRole.createMany({
    data: [
      {
        userId: participant1.id,
        roleId: participantRole.id,
        eventId: null,
      },
    ],
    skipDuplicates: true,
  });

  // Judge
  const judge = await prisma.user.upsert({
    where: { email: 'judge@ehms.com' },
    update: { timezone: 'Asia/Riyadh' },
    create: {
      email: 'judge@ehms.com',
      password,
      name: 'د. خالد السعيد',
      preferredLocale: 'ar',
      timezone: 'Asia/Riyadh',
      emailVerified: true,
    },
  });

  await prisma.userRole.createMany({
    data: [
      {
        userId: judge.id,
        roleId: judgeRole.id,
        eventId: null,
      },
    ],
    skipDuplicates: true,
  });

  // Extra participants & judge (Saudi demo coverage)
  const participant2 = await prisma.user.upsert({
    where: { email: 'participant2@ehms.com' },
    update: { timezone: 'Asia/Riyadh', preferredLocale: 'ar' },
    create: {
      email: 'participant2@ehms.com',
      password,
      name: 'نورة سعد الغامدي',
      bio: 'مهندسة برمجيات — الرياض',
      preferredLocale: 'ar',
      timezone: 'Asia/Riyadh',
      emailVerified: true,
      skills: [{ name: loc('Node.js', 'Node.js'), level: 'advanced' }],
    },
  });

  const participant3 = await prisma.user.upsert({
    where: { email: 'participant3@ehms.com' },
    update: { timezone: 'Asia/Riyadh', preferredLocale: 'ar' },
    create: {
      email: 'participant3@ehms.com',
      password,
      name: 'عبدالله القحطاني',
      bio: 'مطوّر Full-stack — جدة',
      preferredLocale: 'ar',
      timezone: 'Asia/Riyadh',
      emailVerified: true,
      skills: [{ name: loc('Python', 'Python'), level: 'intermediate' }],
    },
  });

  const participant4 = await prisma.user.upsert({
    where: { email: 'participant4@ehms.com' },
    update: { timezone: 'Asia/Riyadh', preferredLocale: 'ar' },
    create: {
      email: 'participant4@ehms.com',
      password,
      name: 'هند المطيري',
      bio: 'مصممة منتجات — الدمام',
      preferredLocale: 'ar',
      timezone: 'Asia/Riyadh',
      emailVerified: true,
      skills: [{ name: loc('UI/UX Design', 'تصميم واجهات المستخدم'), level: 'advanced' }],
    },
  });

  const participant5 = await prisma.user.upsert({
    where: { email: 'participant5@ehms.com' },
    update: { timezone: 'Asia/Riyadh', preferredLocale: 'ar' },
    create: {
      email: 'participant5@ehms.com',
      password,
      name: 'فيصل الدوسري',
      bio: 'محلل بيانات — الخبر',
      preferredLocale: 'ar',
      timezone: 'Asia/Riyadh',
      emailVerified: true,
      skills: [{ name: loc('Data Science', 'علوم البيانات'), level: 'intermediate' }],
    },
  });

  const judge2 = await prisma.user.upsert({
    where: { email: 'judge2@ehms.com' },
    update: { timezone: 'Asia/Riyadh', preferredLocale: 'ar' },
    create: {
      email: 'judge2@ehms.com',
      password,
      name: 'د. مها العتيبي',
      preferredLocale: 'ar',
      timezone: 'Asia/Riyadh',
      emailVerified: true,
    },
  });

  for (const u of [participant2, participant3, participant4, participant5]) {
    await prisma.userRole.createMany({
      data: [{ userId: u.id, roleId: participantRole.id, eventId: null }],
      skipDuplicates: true,
    });
  }

  await prisma.userRole.createMany({
    data: [{ userId: judge2.id, roleId: judgeRole.id, eventId: null }],
    skipDuplicates: true,
  });

  console.log('✓ Created demo users (admin, organizer, participants 1–5, judges 1–2)');

  // ============================================================================
  // DEMO SKILLS
  // ============================================================================
  console.log('Creating demo skills...');

  const skills = [
    { name: { en: 'JavaScript', ar: 'JavaScript' }, category: 'TECHNICAL' },
    { name: { en: 'Python', ar: 'Python' }, category: 'TECHNICAL' },
    { name: { en: 'React', ar: 'React' }, category: 'TECHNICAL' },
    { name: { en: 'Node.js', ar: 'Node.js' }, category: 'TECHNICAL' },
    { name: { en: 'UI/UX Design', ar: 'تصميم واجهات المستخدم' }, category: 'DESIGN' },
    { name: { en: 'Graphic Design', ar: 'التصميم الجرافيكي' }, category: 'DESIGN' },
    { name: { en: 'Business Strategy', ar: 'استراتيجية الأعمال' }, category: 'BUSINESS' },
    { name: { en: 'Marketing', ar: 'التسويق' }, category: 'BUSINESS' },
    { name: { en: 'Data Science', ar: 'علوم البيانات' }, category: 'TECHNICAL' },
    { name: { en: 'Machine Learning', ar: 'التعلم الآلي' }, category: 'TECHNICAL' },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  console.log(`✓ Created ${skills.length} skills`);

  // ============================================================================
  // SAUDI ARABIA — demo events, registrations, teams, submissions, judging
  // (Clears previous demo events owned by organizer@ehms.com, then recreates.)
  // ============================================================================
  console.log('Seeding Saudi Arabia demo events & related data...');

  const organizerRoleRecord = await prisma.role.findUniqueOrThrow({ where: { name: 'ORGANIZER' } });
  const now = new Date();

  await prisma.event.deleteMany({ where: { organizerId: organizer.id } });

  const judgingCriteria = [
    { name: loc('Innovation', 'الابتكار'), weight: 0.35, maxScore: 10 },
    { name: loc('Technical execution', 'التنفيذ التقني'), weight: 0.35, maxScore: 10 },
    { name: loc('Presentation & impact', 'العرض والأثر'), weight: 0.3, maxScore: 10 },
  ];

  const draftEvent = await prisma.event.create({
    data: {
      name: loc('Qiddiya Future Apps (Internal)', 'تطبيقات مستقبل القدية (داخلي)'),
      description: loc(
        'Internal planning sprint for product squads — not published.',
        'سباق تخطيط داخلي لفرق المنتج — غير منشور للجمهور.',
      ),
      state: EventState.DRAFT,
      registrationStart: addDays(now, -5),
      registrationEnd: addDays(now, 10),
      hackingStart: addDays(now, 12),
      hackingEnd: addDays(now, 14),
      judgingEnd: addDays(now, 20),
      resultsDate: addDays(now, 25),
      maxTeamSize: 5,
      minTeamSize: 2,
      allowLateSubmissions: false,
      isPublished: false,
      organizerId: organizer.id,
      rules: loc('EHMS sandbox rules.', 'قواعد بيئة EHMS التجريبية.'),
      prizes: [{ place: 1, name: loc('Recognition', 'تقدير'), amount: 0 }],
      requirements: loc('EHMS account', 'حساب EHMS'),
    },
  });
  await grantOrganizerEventRole(organizer.id, draftEvent.id, organizerRoleRecord.id);

  const publishedTabuk = await prisma.event.create({
    data: {
      name: loc('Tabuk Desert Code Camp', 'معسكر تبوك الصحراوي للبرمجة'),
      description: loc(
        'Weekend build in Tabuk — open source and gov APIs.',
        'بناء خلال نهاية أسبوع في تبوك — مصادر مفتوحة وواجهات حكومية.',
      ),
      state: EventState.PUBLISHED,
      registrationStart: addDays(now, 14),
      registrationEnd: addDays(now, 60),
      hackingStart: addDays(now, 65),
      hackingEnd: addDays(now, 67),
      judgingEnd: addDays(now, 75),
      resultsDate: addDays(now, 80),
      maxTeamSize: 5,
      minTeamSize: 2,
      allowLateSubmissions: false,
      isPublished: true,
      publishedAt: addDays(now, -2),
      organizerId: organizer.id,
      rules: loc('Saudi event code of conduct.', 'مدونة السلوك للفعاليات في المملكة.'),
      prizes: [
        { place: 1, name: loc('Gold — SAR 40,000', 'ذهبي — ٤٠ ألف ريال'), amount: 40000 },
        { place: 2, name: loc('Silver — SAR 20,000', 'فضي — ٢٠ ألف ريال'), amount: 20000 },
      ],
      requirements: loc('Laptop + national ID or iqama.', 'جهاز محمول + هوية أو إقامة.'),
    },
  });
  await grantOrganizerEventRole(organizer.id, publishedTabuk.id, organizerRoleRecord.id);

  const riyadhGovTech = await prisma.event.create({
    data: {
      name: loc('Riyadh GovTech Challenge 2026', 'تحدي الرياض للتقنية الحكومية ٢٠٢٦'),
      description: loc(
        'National hackathon for digital government and smart services in Riyadh.',
        'هاكاثون وطني للحكومة الرقمية والخدمات الذكية في الرياض.',
      ),
      state: EventState.REGISTRATION_OPEN,
      registrationStart: addDays(now, -10),
      registrationEnd: addDays(now, 40),
      hackingStart: addDays(now, 45),
      hackingEnd: addDays(now, 47),
      judgingEnd: addDays(now, 55),
      resultsDate: addDays(now, 60),
      maxTeamSize: 5,
      minTeamSize: 2,
      allowLateSubmissions: false,
      isPublished: true,
      publishedAt: addDays(now, -12),
      organizerId: organizer.id,
      rules: loc('Respect privacy of government test data.', 'احترام خصوصية البيانات التجريبية الحكومية.'),
      prizes: [
        { place: 1, name: loc('First — SAR 50,000', 'الأول — ٥٠ ألف ريال'), amount: 50000 },
        { place: 2, name: loc('Second — SAR 25,000', 'الثاني — ٢٥ ألف ريال'), amount: 25000 },
        { place: 3, name: loc('Third — SAR 10,000', 'الثالث — ١٠ آلاف ريال'), amount: 10000 },
      ],
      requirements: loc('Teams of 2–5. Arabic UI encouraged.', 'فرق من ٢–٥. تشجيع واجهات عربية.'),
    },
  });
  await grantOrganizerEventRole(organizer.id, riyadhGovTech.id, organizerRoleRecord.id);

  const jeddahFintech = await prisma.event.create({
    data: {
      name: loc('Jeddah Fintech Build Weekend', 'أجندة بناء التقنية المالية في جدة'),
      description: loc(
        '48 hours on Red Sea coast — payments, lending, and open banking prototypes.',
        '٤٨ ساعة على ساحل البحر الأحمر — مدفوعات وتمويل ونماذج للبنوك المفتوحة.',
      ),
      state: EventState.TEAM_FORMATION,
      registrationStart: addDays(now, -50),
      registrationEnd: addDays(now, -5),
      hackingStart: addDays(now, 3),
      hackingEnd: addDays(now, 5),
      judgingEnd: addDays(now, 12),
      resultsDate: addDays(now, 16),
      maxTeamSize: 5,
      minTeamSize: 2,
      allowLateSubmissions: false,
      isPublished: true,
      publishedAt: addDays(now, -52),
      organizerId: organizer.id,
      rules: loc('SAMF sandbox policies apply.', 'تطبق سياسات البيئة التجريبية للبنك المركزي السعودي.'),
      prizes: [{ place: 1, name: loc('Accelerator fast-track', 'مسار مسرّع'), amount: 0 }],
      requirements: loc('SAMF compliance checklist.', 'قائمة التحقق للامتثال.'),
    },
  });
  await grantOrganizerEventRole(organizer.id, jeddahFintech.id, organizerRoleRecord.id);

  const neomMobility = await prisma.event.create({
    data: {
      name: loc('NEOM Smart Mobility Sprint', 'سباق نيوم للتنقل الذكي'),
      description: loc(
        'Build mobility insights for linear city corridors and regional hubs.',
        'رؤى تنقل لممرات المدينة الخطية والعقد الإقليمية.',
      ),
      state: EventState.HACKING_PHASE,
      registrationStart: addDays(now, -80),
      registrationEnd: addDays(now, -40),
      hackingStart: addDays(now, -3),
      hackingEnd: addDays(now, 10),
      judgingEnd: addDays(now, 18),
      resultsDate: addDays(now, 22),
      maxTeamSize: 5,
      minTeamSize: 2,
      allowLateSubmissions: false,
      isPublished: true,
      publishedAt: addDays(now, -82),
      organizerId: organizer.id,
      rules: loc('Use synthetic datasets only.', 'استخدام بيانات تركيبية فقط.'),
      prizes: [
        { place: 1, name: loc('Pilot with mobility partner', 'تجربة مع شريك تنقل'), amount: 0 },
      ],
      requirements: loc('Arabic + English README.', 'ملف README بالعربية والإنجليزية.'),
    },
  });
  await grantOrganizerEventRole(organizer.id, neomMobility.id, organizerRoleRecord.id);

  const easternNlp = await prisma.event.create({
    data: {
      name: loc('Eastern Province AI — Arabic NLP', 'الذكاء الاصطناعي في المنطقة الشرقية — معالجة اللغة العربية'),
      description: loc(
        'Dialect-aware NLP tools for customer care in Dammam & Khobar.',
        'أدوات لغوية تراعي اللهجة لخدمة العملاء في الدمام والخبر.',
      ),
      state: EventState.JUDGING,
      registrationStart: addDays(now, -100),
      registrationEnd: addDays(now, -70),
      hackingStart: addDays(now, -30),
      hackingEnd: addDays(now, -5),
      judgingEnd: addDays(now, 14),
      resultsDate: addDays(now, 20),
      maxTeamSize: 5,
      minTeamSize: 2,
      allowLateSubmissions: false,
      isPublished: true,
      publishedAt: addDays(now, -102),
      organizerId: organizer.id,
      rules: loc('No scraping of personal data.', 'منع جمع البيانات الشخصية.'),
      prizes: [{ place: 1, name: loc('Research grant — SAR 35,000', 'منحة بحثية — ٣٥ ألف ريال'), amount: 35000 }],
      requirements: loc('Model card required.', 'بطاقة نموذج مطلوبة.'),
    },
  });
  await grantOrganizerEventRole(organizer.id, easternNlp.id, organizerRoleRecord.id);

  const visionCup = await prisma.event.create({
    data: {
      name: loc('Vision 2030 Youth Innovation Cup', 'كأس الشباب للابتكار — رؤية ٢٠٣٠'),
      description: loc(
        'Nationwide youth track — winners announced from Riyadh.',
        'مسار شبابي على مستوى المملكة — إعلان الفائزين من الرياض.',
      ),
      state: EventState.RESULTS_PUBLISHED,
      registrationStart: addDays(now, -200),
      registrationEnd: addDays(now, -170),
      hackingStart: addDays(now, -160),
      hackingEnd: addDays(now, -150),
      judgingEnd: addDays(now, -140),
      resultsDate: addDays(now, -130),
      maxTeamSize: 5,
      minTeamSize: 2,
      allowLateSubmissions: false,
      isPublished: true,
      publishedAt: addDays(now, -205),
      organizerId: organizer.id,
      rules: loc('Youth eligibility per terms PDF.', 'أهلية الشباب وفق ملف الشروط.'),
      prizes: [{ place: 1, name: loc('National trophy + SAR 60,000', 'كأس وطني + ٦٠ ألف ريال'), amount: 60000 }],
      requirements: loc('Age 18–30, Saudi or resident.', 'العمر ١٨–٣٠، سعودي أو مقيم.'),
    },
  });
  await grantOrganizerEventRole(organizer.id, visionCup.id, organizerRoleRecord.id);

  const allParticipantIds = [participant1, participant2, participant3, participant4, participant5].map((u) => u.id);

  await prisma.eventRegistration.createMany({
    data: allParticipantIds.map((userId) => ({ eventId: riyadhGovTech.id, userId, status: 'REGISTERED' })),
    skipDuplicates: true,
  });

  await prisma.team.create({
    data: {
      name: loc('Digital Najd Squad', 'فريق نجد الرقمي'),
      description: loc('GovTech prototypes for citizen journeys.', 'نماذج تقنية حكومية لرحلات المواطن.'),
      eventId: riyadhGovTech.id,
      leaderId: participant1.id,
      members: {
        create: [
          { userId: participant1.id, role: 'LEADER' },
          { userId: participant3.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.eventRegistration.createMany({
    data: [participant1.id, participant2.id].map((userId) => ({
      eventId: jeddahFintech.id,
      userId,
      status: 'REGISTERED',
    })),
    skipDuplicates: true,
  });

  await prisma.team.create({
    data: {
      name: loc('Red Sea Pay', 'ريد سي باي'),
      description: loc('Receipt intelligence for coastal SMEs.', 'ذكاء الوصولات للمنشآت الساحلية الصغيرة.'),
      eventId: jeddahFintech.id,
      leaderId: participant1.id,
      members: {
        create: [
          { userId: participant1.id, role: 'LEADER' },
          { userId: participant2.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.eventRegistration.createMany({
    data: allParticipantIds.map((userId) => ({ eventId: neomMobility.id, userId, status: 'REGISTERED' })),
    skipDuplicates: true,
  });

  await prisma.eventRegistration.createMany({
    data: [participant1.id, participant2.id, participant3.id, participant4.id].map((userId) => ({
      eventId: easternNlp.id,
      userId,
      status: 'REGISTERED',
    })),
    skipDuplicates: true,
  });

  const neomTeam1 = await prisma.team.create({
    data: {
      name: loc('Nabd Riyadh', 'نبض الرياض'),
      description: loc('Live occupancy & ETA for Riyadh buses.', 'إشغال فوري وتوقيت وصول لحافلات الرياض.'),
      eventId: neomMobility.id,
      leaderId: participant1.id,
      members: {
        create: [
          { userId: participant1.id, role: 'LEADER' },
          { userId: participant2.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const teamNomCoast = await prisma.team.create({
    data: {
      name: loc('Red Sea Builders', 'بناءة البحر الأحمر'),
      description: loc('Intermodal routing for coastal cities.', 'توجيه بين وسائل النقل للمدن الساحلية.'),
      eventId: neomMobility.id,
      leaderId: participant3.id,
      members: {
        create: [
          { userId: participant3.id, role: 'LEADER' },
          { userId: participant4.id, role: 'MEMBER' },
          { userId: participant5.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.submission.create({
    data: {
      teamId: neomTeam1.id,
      eventId: neomMobility.id,
      authorId: participant1.id,
      title: loc('Riyadh Pulse — live occupancy map', 'نبض الرياض — خريطة إشغال فورية'),
      description: loc(
        'Riders see crowding and ETA; organizers see corridor KPIs.',
        'المستفيد يرى الازدحام والوقت؛ المنظم يرى مؤشرات الممر.',
      ),
      demoUrl: 'https://demo.ehms.local/riyadh-pulse',
      repoUrl: 'https://github.com/example/riyadh-pulse',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: addDays(now, -1),
    },
  });

  await prisma.submission.create({
    data: {
      teamId: teamNomCoast.id,
      eventId: neomMobility.id,
      authorId: participant3.id,
      title: loc('CoastLink — intermodal planner', 'كوست لينك — مخطط متعدد الوسائط'),
      description: loc(
        'Ferry + rail + bus itineraries for Jeddah–Yanbu corridor.',
        'مسارات عبّارة + قطار + حافلة لممر جدة–ينبع.',
      ),
      demoUrl: 'https://demo.ehms.local/coastlink',
      repoUrl: 'https://github.com/example/coastlink',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: addDays(now, -2),
    },
  });

  const nlpTeamAlpha = await prisma.team.create({
    data: {
      name: loc('Khobar NLP Lab', 'مختبر الخبر للغة'),
      description: loc('Dialect tagging for Eastern customer care.', 'وسم لهجات لخدمة عملاء الشرقية.'),
      eventId: easternNlp.id,
      leaderId: participant1.id,
      members: {
        create: [
          { userId: participant1.id, role: 'LEADER' },
          { userId: participant2.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const nlpTeamBeta = await prisma.team.create({
    data: {
      name: loc('Dammam Care AI', 'دمام كير الذكية'),
      description: loc('Summaries and reply hints for Arabic tickets.', 'ملخصات واقتراحات رد لتذاكر عربية.'),
      eventId: easternNlp.id,
      leaderId: participant3.id,
      members: {
        create: [
          { userId: participant3.id, role: 'LEADER' },
          { userId: participant4.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const subNlpA = await prisma.submission.create({
    data: {
      teamId: nlpTeamAlpha.id,
      eventId: easternNlp.id,
      authorId: participant1.id,
      title: loc('Eastern dialect tagger', 'موسم وسوم اللهجات الشرقية'),
      description: loc(
        'Lightweight classifier for Eastern Province Arabic in support chats.',
        'مصنف خفيف للهجة الشرقية في محادثات الدعم.',
      ),
      demoUrl: 'https://demo.ehms.local/eastern-dialect',
      repoUrl: 'https://github.com/example/eastern-dialect',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: addDays(now, -6),
    },
  });

  await prisma.submission.create({
    data: {
      teamId: nlpTeamBeta.id,
      eventId: easternNlp.id,
      authorId: participant3.id,
      title: loc('TicketMind — Arabic copilot', 'تذكرة مايند — مساعد عربي'),
      description: loc(
        'Copilot drafts for agents with compliance guardrails.',
        'مسودات للموظفين مع ضوابط امتثال.',
      ),
      demoUrl: 'https://demo.ehms.local/ticketmind',
      repoUrl: 'https://github.com/example/ticketmind',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: addDays(now, -5),
    },
  });

  const assignment = await prisma.judgingAssignment.create({
    data: {
      eventId: easternNlp.id,
      judgeId: judge.id,
      criteria: judgingCriteria as any,
    },
  });

  await prisma.judgingScore.create({
    data: {
      submissionId: subNlpA.id,
      assignmentId: assignment.id,
      judgeId: judge.id,
      scores: {
        Innovation: 8,
        'Technical execution': 9,
        'Presentation & impact': 7,
      } as any,
      totalScore: 80.5,
      feedback: loc('Strong MVP with clear evaluation plan.', 'نموذج أولي قوي مع خطة تقييم واضحة.'),
    },
  });

  await prisma.judgingAssignment.create({
    data: {
      eventId: easternNlp.id,
      judgeId: judge2.id,
      criteria: judgingCriteria as any,
    },
  });

  console.log('✓ Seeded 7 KSA-themed events + registrations, teams, submissions, judging');

  // ============================================================================
  // ADDITIONAL TEAMS — richer teams page demo for participant1
  // ============================================================================
  console.log('Seeding additional demo teams...');

  // Register participants in riyadhGovTech (already done above) and visionCup
  await prisma.eventRegistration.createMany({
    data: allParticipantIds.map((userId) => ({ eventId: visionCup.id, userId, status: 'REGISTERED' })),
    skipDuplicates: true,
  });

  // Register participants in publishedTabuk
  await prisma.eventRegistration.createMany({
    data: allParticipantIds.map((userId) => ({ eventId: publishedTabuk.id, userId, status: 'REGISTERED' })),
    skipDuplicates: true,
  });

  // Vision Cup — participant1 leads a full team (5 members)
  await prisma.team.create({
    data: {
      name: loc('Sarab AI', 'سراب للذكاء الاصطناعي'),
      description: loc(
        'Youth-driven AI tools for Vision 2030 social programs.',
        'أدوات ذكاء اصطناعي بقيادة شبابية لبرامج رؤية ٢٠٣٠.',
      ),
      eventId: visionCup.id,
      leaderId: participant1.id,
      isLocked: true,
      members: {
        create: [
          { userId: participant1.id, role: 'LEADER' },
          { userId: participant2.id, role: 'MEMBER' },
          { userId: participant3.id, role: 'MEMBER' },
          { userId: participant4.id, role: 'MEMBER' },
          { userId: participant5.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Riyadh GovTech — participant1 joins as member (different team)
  await prisma.team.create({
    data: {
      name: loc('Tamkeen Platform', 'منصة تمكين'),
      description: loc(
        'Citizen empowerment dashboard for government e-services.',
        'لوحة تمكين المواطن لخدمات الحكومة الإلكترونية.',
      ),
      eventId: riyadhGovTech.id,
      leaderId: participant2.id,
      members: {
        create: [
          { userId: participant2.id, role: 'LEADER' },
          { userId: participant1.id, role: 'MEMBER' },
          { userId: participant4.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Tabuk Desert Code Camp — participant1 leads a small team
  await prisma.team.create({
    data: {
      name: loc('Desert Data Crew', 'طاقم بيانات الصحراء'),
      description: loc(
        'Open-source mapping tools for Tabuk wilderness areas.',
        'أدوات رسم خرائط مفتوحة المصدر لمناطق طبيعة تبوك.',
      ),
      eventId: publishedTabuk.id,
      leaderId: participant1.id,
      members: {
        create: [
          { userId: participant1.id, role: 'LEADER' },
          { userId: participant5.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // NEOM — participant1 joins a locked team
  await prisma.team.create({
    data: {
      name: loc('Helix Mobility', 'هيليكس للتنقل'),
      description: loc(
        'Predictive transit corridors for NEOM linear city.',
        'ممرات عبور تنبؤية لمدينة نيوم الخطية.',
      ),
      eventId: neomMobility.id,
      leaderId: participant4.id,
      isLocked: true,
      members: {
        create: [
          { userId: participant4.id, role: 'LEADER' },
          { userId: participant1.id, role: 'MEMBER' },
          { userId: participant5.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✓ Seeded 4 additional teams for richer teams page demo');

  console.log('');
  console.log('✅ Seed completed!');
  console.log('');
  console.log('Demo accounts (password for all: Password123!)');
  console.log('  Super Admin: admin@ehms.com');
  console.log('  Organizer:   organizer@ehms.com');
  console.log('  Participants: participant1@ehms.com … participant5@ehms.com');
  console.log('  Judges:      judge@ehms.com, judge2@ehms.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
