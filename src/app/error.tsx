"use client";

import { Button, Center, Stack, Text, Title } from "@mantine/core";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Center mih="100dvh" px="lg">
      <Stack align="center" gap="md">
        <Stack align="center" gap={4}>
          <Title order={1} size="h4">
            The tray generator hit a snag
          </Title>
          <Text size="sm" c="dimmed" ta="center" maw={420}>
            Something went wrong while building the model. This can happen if the WASM geometry
            kernel failed to load. Try again, or reload the page.
          </Text>
        </Stack>
        <Button onClick={reset}>Try again</Button>
      </Stack>
    </Center>
  );
}
