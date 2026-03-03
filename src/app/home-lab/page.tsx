import { HomeLanding } from '@/app/HomeLanding';

type HomeLabPageProps = {
  searchParams: Promise<{ edit?: string | string[] }>;
};

function shouldOpenEditMode(editParam: string | string[] | undefined) {
  const rawValue = Array.isArray(editParam) ? editParam[0] : editParam;
  const normalized = String(rawValue || '').toLowerCase().trim();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

export default async function HomeLabPage({ searchParams }: HomeLabPageProps) {
  const params = await searchParams;
  const forceEditMode = shouldOpenEditMode(params?.edit);

  return <HomeLanding forceEditMode={forceEditMode} />;
}
