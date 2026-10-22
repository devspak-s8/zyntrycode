import { Composition } from "remotion";
import { ZyntryDemo } from "./Demo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ZyntryDemo"
        component={ZyntryDemo}
        durationInFrames={1920}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ theme: "dark" }}
      />
      <Composition
        id="ZyntryDemoLight"
        component={ZyntryDemo}
        durationInFrames={1920}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ theme: "light" }}
      />
    </>
  );
};