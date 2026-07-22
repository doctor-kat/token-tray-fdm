"use client";

import { Center, Stack, Text } from "@mantine/core";
import * as React from "react";

// Confines render failures from the 3D viewer (a WASM kernel that never loaded,
// a bad mesh, a three.js throw) to the preview box instead of letting them tear
// down the whole app through the route-level error boundary.
export class ViewerBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.failed) {
      return (
        <Center h="100%" p="lg">
          <Stack align="center" gap={4}>
            <Text size="sm" fw={700}>
              3D preview unavailable
            </Text>
            <Text size="xs" c="dimmed" ta="center" maw={260}>
              The geometry kernel failed to load. Editing and export still work — reload the page to
              retry the preview.
            </Text>
          </Stack>
        </Center>
      );
    }

    return this.props.children;
  }
}
