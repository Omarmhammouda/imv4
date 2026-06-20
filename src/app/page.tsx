import HomeExperience from "@/components/chapters/HomeExperience";
import { getContent } from "@/lib/content";

export default async function Home() {
  const { chapters } = await getContent();
  return <HomeExperience chapters={chapters} />;
}
