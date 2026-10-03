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
      <Composition id="Outro" component={Outro} durationInFrames={OUTRO_FRAMES} {...SIZE} />
      {ROLES.map(({ id, props }) => (
        <Composition key={id} id={id} component={RoleBadge} durationInFrames={ROLE_FRAMES} defaultProps={props} {...SIZE} />
      ))}
    </>
  );
}
