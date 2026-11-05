import NightWalk from "@/components/nightwalk/NightWalk";
import { getContent } from "@/lib/content";
import { buildWalls } from "@/lib/walls";

export default async function Home() {
  const { murals, homeWalls } = await getContent();
  // Walls come from murals marked "Show on home" in the admin; until any are,
  // fall back to the bundled set.
  return <NightWalk walls={homeWalls.length ? homeWalls : buildWalls(murals)} />;
}
