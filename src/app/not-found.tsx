import { Button, Center, Stack, Text, Title } from "@mantine/core";

export default function NotFound() {
  return (
    <Center mih="100dvh" px="lg">
      <Stack align="center" gap="md">
        <Stack align="center" gap={4}>
          <Text size="sm" fw={500} c="dimmed">
            404
          </Text>
          <Title order={1} size="h4">
            This page doesn&apos;t exist
          </Title>
        </Stack>
        <Button component="a" href="/">
          Back to the tray
        </Button>
      </Stack>
    </Center>
  );
}
