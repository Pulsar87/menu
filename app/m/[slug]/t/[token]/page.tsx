export default async function TableMenuPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  
  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-bold">Table Menu - {slug}</h1>
      <p>Table token: {token}</p>
    </div>
  );
}
