/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-sm": "48em", // 768px — plan + 3D side by side
        "mantine-breakpoint-md": "67.5em", // 1080px — controls move to a right rail
      },
    },
  },
};

export default config;
