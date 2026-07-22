import { Center, Loader, Stack, Text } from "@mantine/core";

export default function Loading() {
  return (
    <Center mih="100dvh">
      <Stack align="center" gap="sm">
        <Loader size="md" />
        <Text size="sm" fw={500} c="dimmed">
          Loading the tray workshop…
        </Text>
      </Stack>
    </Center>
  );
}
