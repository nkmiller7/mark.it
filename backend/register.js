import { register } from "tsconfig-paths";

register({
    baseUrl: `${import.meta.dirname}/dist`,
    paths: { "@/*": ["*"] },
});
