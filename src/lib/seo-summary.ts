import { getSeoAudits, getSiteChecks } from "@/lib/seo-audit";
import { contentScore, technicalScore, type Todo } from "@/lib/seo-score";
import { getPublishedPosts, getSiteSeo, siteCmsConfigured } from "@/lib/site-cms";

export interface SeoSummary {
  technical: number | null;
  content: number;
  todos: Todo[];
}

/** The two scores and the top of the to-do list, for the marketing dashboard card. */
export async function getSeoSummary(): Promise<SeoSummary> {
  const configured = siteCmsConfigured();
  const [audits, siteChecks, seo, posts] = await Promise.all([getSeoAudits(), getSiteChecks(), configured ? getSiteSeo() : null, configured ? getPublishedPosts() : null]);
  const technical = technicalScore(audits, siteChecks);
  const content = contentScore({ audits, postsPublished: posts?.total ?? null, latestPostAt: posts?.latestAt ?? null, businessProfileUrl: seo?.businessProfileUrl ?? "" });
  const order = { fail: 0, warn: 1, pass: 2 };
  return { technical: technical.percent, content: content.percent, todos: [...technical.todos, ...content.todos].sort((a, b) => order[a.status] - order[b.status]) };
}
