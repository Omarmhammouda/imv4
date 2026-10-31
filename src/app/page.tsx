import NightWalk from "@/components/nightwalk/NightWalk";
import { getContent } from "@/lib/content";
import { buildWalls } from "@/lib/walls";

export default async function Home() {
  const { murals } = await getContent();
  return <NightWalk walls={buildWalls(murals)} />;
}
