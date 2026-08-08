"""Platform distribution agents — optimize content per channel."""

from __future__ import annotations

from app.agents.base.agent import AgentContext, AgentResult, BaseAgent
from app.core.enums import AgentType, DistributionChannel


CHANNEL_PROMPTS = {
    DistributionChannel.WEBSITE: "Prepare full article packaging for the website.",
    DistributionChannel.FACEBOOK: "Create a visual summary with hook + link CTA for Facebook.",
    DistributionChannel.LINKEDIN_COMPANY: "Write a professional thought-leadership LinkedIn company post.",
    DistributionChannel.LINKEDIN_PERSONAL: "Write a personal LinkedIn thought leadership post.",
    DistributionChannel.TWITTER: "Create an X/Twitter thread (5-8 tweets) with a strong opener.",
    DistributionChannel.TELEGRAM: "Write a short Telegram update with key takeaways.",
    DistributionChannel.DISCORD: "Seed a Discord community discussion with questions.",
    DistributionChannel.EMAIL: "Write newsletter teaser copy.",
    DistributionChannel.RSS: "Produce clean RSS title/description/enclosure metadata.",
}


class DistributionFormatterAgent(BaseAgent):
    agent_type = AgentType.PUBLISHING_ORCHESTRATOR
    name = "Distribution Formatter"

    async def format_for_channel(
        self,
        *,
        title: str,
        body: str,
        channel: DistributionChannel,
        url: str | None = None,
    ) -> tuple[str, int]:
        instruction = CHANNEL_PROMPTS[channel]
        prompt = f"{instruction}\nTitle: {title}\nURL: {url or ''}\nBody:\n{body[:4000]}"
        return await self.generate_text(prompt, system="You adapt content for each social platform.")

    async def execute(self, context: AgentContext) -> AgentResult:
        title = context.payload.get("title", "")
        body = context.payload.get("body", "")
        url = context.payload.get("url")
        channels = context.payload.get("channels") or [c.value for c in DistributionChannel]
        outputs: dict[str, str] = {}
        tokens_total = 0
        for channel_name in channels:
            try:
                channel = DistributionChannel(channel_name)
            except ValueError:
                continue
            text, tokens = await self.format_for_channel(title=title, body=body, channel=channel, url=url)
            outputs[channel.value] = text
            tokens_total += tokens
        return AgentResult(
            success=True,
            agent_type=self.agent_type,
            output={"channel_content": outputs},
            artifacts=[{"kind": "distribution_pack", "content": outputs}],
            tokens_used=tokens_total,
        )
