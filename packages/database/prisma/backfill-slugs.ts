import { PrismaClient } from '@prisma/client';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function main() {
  const prisma = new PrismaClient();
  const subs = await prisma.submission.findMany();
  const used = new Set<string>();
  let updated = 0;

  for (const s of subs) {
    const t = s.title as unknown as { en?: string; ar?: string } | string;
    const baseEn =
      (typeof t === 'string' ? t : t?.en || t?.ar) || 'submission';
    let base = slugify(baseEn) || 'submission';
    let candidate = base;
    let n = 2;
    while (used.has(candidate)) {
      const suffix = `-${n++}`;
      candidate = `${base.slice(0, 60 - suffix.length)}${suffix}`;
    }
    used.add(candidate);

    if (s.slug !== candidate) {
      // guard against rare collisions with rows outside this batch
      const clash = await prisma.submission.findUnique({ where: { slug: candidate } });
      if (clash && clash.id !== s.id) continue;
      await prisma.submission.update({ where: { id: s.id }, data: { slug: candidate } });
      updated++;
      console.log(`${s.id} -> ${candidate}`);
    }
  }

  console.log(`Backfilled ${updated}/${subs.length} submission slugs`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
