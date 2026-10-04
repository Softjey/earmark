import { Composition } from "remotion";
import { Intro } from "./Intro";
import { introFrames } from "./timeline";
import { Outro, OUTRO_FRAMES } from "./Outro";
import { ROLE_FRAMES, RoleBadge, type RoleBadgeProps } from "./RoleBadge";
import { FPS } from "./theme";

const SIZE = { width: 1920, height: 1080, fps: FPS };

const ROLES: { id: string; props: RoleBadgeProps }[] = [
  { id: "RoleOrganizer", props: { role: "organizer", title: "Organizer", sub: "starts the fundraiser" } },
  { id: "RoleClinic", props: { role: "clinic", title: "Eye Clinic", sub: "verified recipient" } },
  { id: "RoleDonor1", props: { role: "donor", title: "Donor 1", sub: "donates from their own wallet" } },
  { id: "RoleDonor2", props: { role: "donor", title: "Donor 2", sub: "donates from their own wallet" } },
];

export function RemotionRoot() {
  return (
    <>
      <Composition id="Intro" component={Intro} durationInFrames={introFrames("default")} {...SIZE} />
      <Composition id="IntroVoice" component={Intro} durationInFrames={introFrames("default")} defaultProps={{ voice: true }} {...SIZE} />
      <Composition
        id="IntroLewandowski"
        component={Intro}
        durationInFrames={introFrames("lewandowski")}
        defaultProps={{ voice: true, variant: "lewandowski" as const }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV8"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v8", "brisk")}
        defaultProps={{
          voice: true,
          variant: "lewandowski-v8" as const,
          score: "score-lewandowski-v6-dynamic",
          sfx: "key" as const,
          sounds: "v8" as const,
          pacing: "brisk" as const,
          fx: false,
          look: "v8" as const,
        }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV7"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v7", "brisk")}
        defaultProps={{
          voice: true,
          variant: "lewandowski-v7" as const,
          score: "score-lewandowski-v7-dynamic",
          sfx: "key" as const,
          sounds: "v5" as const,
          sfxGain: 0.5,
          pacing: "brisk" as const,
          fx: false,
          look: "v7" as const,
        }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV6Dynamic"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v6", "brisk")}
        defaultProps={{
          voice: true,
          variant: "lewandowski-v6" as const,
          score: "score-lewandowski-v6-dynamic",
          sfx: "key" as const,
          sounds: "v5" as const,
          sfxGain: 0.5,
          pacing: "brisk" as const,
          fx: false,
        }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV5"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v5")}
        defaultProps={{ voice: true, variant: "lewandowski-v5" as const, score: "score-lewandowski-v5", sfx: "key" as const, sounds: "v5" as const, sfxGain: 0.5 }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV5Dynamic"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v5", "dynamic")}
        defaultProps={{
          voice: true,
          variant: "lewandowski-v5" as const,
          score: "score-lewandowski-v5-dynamic",
          sfx: "key" as const,
          sounds: "v5" as const,
          sfxGain: 0.5,
          pacing: "dynamic" as const,
          fx: false,
        }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV4"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v4")}
        defaultProps={{ voice: true, variant: "lewandowski-v4" as const, score: "score-lewandowski-v4", sfx: "key" as const, sounds: "v4" as const }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV4Dynamic"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v4", "dynamic")}
        defaultProps={{
          voice: true,
          variant: "lewandowski-v4" as const,
          score: "score-lewandowski-v4-dynamic",
          sfx: "full" as const,
          sounds: "v4" as const,
          pacing: "dynamic" as const,
        }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV3"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v3")}
        defaultProps={{ voice: true, variant: "lewandowski-v3" as const, music: true, sfx: "key" as const }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV3Dynamic"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v3", "dynamic")}
        defaultProps={{ voice: true, variant: "lewandowski-v3" as const, music: true, sfx: "full" as const, pacing: "dynamic" as const }}
        {...SIZE}
      />
      <Composition
        id="IntroLewandowskiV2"
        component={Intro}
        durationInFrames={introFrames("lewandowski-v2")}
        defaultProps={{ voice: true, variant: "lewandowski-v2" as const }}
        {...SIZE}
      />
      <Composition id="Outro" component={Outro} durationInFrames={OUTRO_FRAMES} {...SIZE} />
      {ROLES.map(({ id, props }) => (
        <Composition key={id} id={id} component={RoleBadge} durationInFrames={ROLE_FRAMES} defaultProps={props} {...SIZE} />
      ))}
    </>
  );
}
