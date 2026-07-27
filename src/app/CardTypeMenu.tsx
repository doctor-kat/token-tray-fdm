"use client";

import { Box, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { ChevronDown } from "lucide-react";
import { CARD_PRESETS, type CardPresetId } from "@/app/lib/quick-draw";
import { ICON } from "@/app/icons/tokens";

const TRIGGER_SURFACE = "var(--mantine-color-sand-2)";

// SVG icons for each specific card type preset
export function CardTypeIcon({ type, size = 36 }: { type: CardPresetId; size?: number }) {
  switch (type) {
    case "magicCards":
      // standard poker cards
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
          <rect x="16.3" y="10" width="31.4" height="44" rx="4.4" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <text x="19.8" y="22" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>A</text>
          <text x="19.3" y="31" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>♠</text>
        </svg>
      );
    case "sleevedMagicCards":
      // standard sleeved
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
          <rect x="13" y="8" width="38" height="48" rx="4.5" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <line x1="13" y1="8" x2="51" y2="8" stroke={ICON.line} strokeWidth="1" strokeDasharray="2 2" />
          <rect x="16" y="10" width="32" height="44" rx="4.5" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <text x="19.5" y="22" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>A</text>
          <text x="19" y="31" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>♠</text>
        </svg>
      );
    case "playingCards":
      // European playing cards
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
          <rect x="17.5" y="9" width="29" height="46" rx="4.1" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <text x="21" y="21" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>K</text>
          <text x="20.5" y="30" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill="#e2857a">♥</text>
        </svg>
      );
    case "tallCards":
    case "sleevedTallCards":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
          <rect x="18" y="7" width="28" height="50" rx="4" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <text x="21.5" y="19" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>K</text>
          <text x="21" y="28" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill="#e2857a">♥</text>
        </svg>
      );
    case "smallCards":
      // Mini euro cards
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
          <rect x="21" y="15" width="22" height="34" rx="3.1" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <text x="24.5" y="27" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>Q</text>
          <text x="24" y="36" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill="#e2857a">♦</text>
        </svg>
      );
    case "smallCardsUS":
      // Mini US cards
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
          <rect x="21" y="15" width="22.1" height="34" rx="3.1" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <text x="24.5" y="27" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>J</text>
          <text x="24" y="36" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>♣</text>
        </svg>
      );
    case "sleevedSmallCards":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
          <rect x="18" y="13" width="28" height="38" rx="3.5" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <line x1="18" y1="13" x2="46" y2="13" stroke={ICON.line} strokeWidth="1" strokeDasharray="2 2" />
          <rect x="21" y="15" width="22" height="34" rx="3.1" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <text x="24.5" y="27" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={ICON.line}>Q</text>
          <text x="24" y="36" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill="#e2857a">♦</text>
        </svg>
      );
    case "custom":
    default:
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
          <rect x="17" y="11" width="30" height="42" rx="4" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
          <text x="26" y="36" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="600" fill={ICON.line}>?</text>
        </svg>
      );
  }
}

export function CardTypeMenu({
  value,
  onChange,
}: {
  value: CardPresetId;
  onChange: (id: CardPresetId) => void;
}) {
  const current = CARD_PRESETS.find((c) => c.id === value) ?? CARD_PRESETS[0];

  return (
    <Menu position="bottom-start" shadow="md" withinPortal>
      <Menu.Target>
        <UnstyledButton>
          <Group
            gap={8}
            wrap="nowrap"
            bg={TRIGGER_SURFACE}
            pl={8}
            pr={10}
            py={5}
            style={{
              border: "1px solid var(--mantine-color-sand-6)",
              borderRadius: 999,
            }}
          >
            <CardTypeIcon type={current.id} size={36} />
            <Text size="xs" fw={700} ff="monospace" c="black">
              {current.label}
            </Text>
            <ChevronDown size={20} color="var(--mantine-color-sand-8)" />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {CARD_PRESETS.map((c) => (
          <Menu.Item
            key={c.id}
            onClick={() => {
              onChange(c.id);
            }}
            leftSection={<CardTypeIcon type={c.id} size={32} />}
          >
            <Box>
              <Text size="sm" fw={700} ff="monospace">
                {c.label}
              </Text>
              <Text size="xs" c="dimmed">
                {c.cardWidth} × {c.cardHeight} mm
              </Text>
            </Box>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
