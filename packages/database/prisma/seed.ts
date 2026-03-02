import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
    update: {},
    create: {
      email: 'organizer@ehms.com',
      password,
      name: 'محمد أحمد',
      preferredLocale: 'ar',
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
    update: {},
    create: {
      email: 'participant1@ehms.com',
      password,
      name: 'فاطمة علي',
      bio: 'مطورة واجهات أمامية متحمسة',
      preferredLocale: 'ar',
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
    update: {},
    create: {
      email: 'judge@ehms.com',
      password,
      name: 'د. خالد السعيد',
      preferredLocale: 'ar',
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

  console.log('✓ Created 4 demo users');

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

  console.log('');
  console.log('✅ Seed completed!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Super Admin: admin@ehms.com / Password123!');
  console.log('  Organizer: organizer@ehms.com / Password123!');
  console.log('  Participant: participant1@ehms.com / Password123!');
  console.log('  Judge: judge@ehms.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
