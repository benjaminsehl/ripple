import { Button } from "./button.tsx";
import { Stack } from "./stack.tsx";
export const a = <Button variant="outline" data-test="1" title="x" aria-describedby="y">A</Button>;
// @ts-expect-error unknown prop
export const b = <Button varient="outline">A</Button>;
// @ts-expect-error bad enum
export const c = <Button variant="huge">A</Button>;
export const d = <Stack gap="2 md:6" direction="column md:row" hidden>x</Stack>;
export const e = <Stack gap={4} as="ul">x</Stack>;
// @ts-expect-error object form is rejected
export const f = <Stack gap={{ base: 2, md: 6 }}>x</Stack>;
