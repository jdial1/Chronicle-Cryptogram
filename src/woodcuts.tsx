import type { ReactNode, SVGProps } from 'react';

type PlateProps = SVGProps<SVGSVGElement>;

function Plate({ d, children, ...props }: PlateProps & { d: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" {...props}>
      <path fillRule="evenodd" d={d} />
      {children}
    </svg>
  );
}

function GiSecretBook(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M7 16.2 32 12.2 57 16.2 58.4 50.2C58.4 53.1 55.7 55 52.6 54.4L32 57.8 11.4 54.4C8.3 55 5.6 53.1 5.6 50.2Z
         M12 22.2H29V23.45H12ZM12 26.1H28.2V27.35H12ZM12 30H26.5V31.25H12ZM12 33.9H28.4V35.15H12ZM12 37.8H25.8V39.05H12ZM12 41.7H28V42.95H12ZM12 45.6H27.2V46.85H12Z
         M36 22.2H52V23.45H36ZM35.6 26.1H52.2V27.35H35.6ZM37.2 30H52V31.25H37.2ZM35.8 33.9H51.4V35.15H35.8ZM36.4 37.8H52V39.05H36.4ZM35.5 41.7H51.6V42.95H35.5ZM36.8 45.6H50.8V46.85H36.8Z
         M30.9 14.2H33.1V55.2H30.9Z"
    />
  );
}

function GiPoisonBottle(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M32 3.8c3.6 0 5.7 2.4 5.7 5.4v3.2h1.7v2.6l5.4 3.1 1.7 3.6v32.4c0 4.6-4.6 7.1-14.5 7.1s-14.5-2.5-14.5-7.1V21.7l1.7-3.6 5.4-3.1v-2.6h1.7V9.2c0-3 2.1-5.4 5.7-5.4z
         M32 6.2c-1.7 0-2.8 1.1-2.8 2.6s1.1 2.5 2.8 2.5 2.8-1.1 2.8-2.5-1.1-2.6-2.8-2.6z
         M24.2 29.2h1.55v22.6H24.2zm3.5 0h1.45v22.6H27.7zm5.15 0h1.5v22.6h-1.5zm3.55 0H38.2v22.6h-1.8z
         M26.6 33.2h10.8v10.4H26.6z
         M30.2 36.1c0-.7.6-1.2 1.8-1.2s1.8.5 1.8 1.2v.2c.7.3 1.2.9 1.2 1.7 0 1.1-1 1.7-1.8 1.9v.8h-2.4v-.8c-.8-.2-1.8-.8-1.8-1.9 0-.8.5-1.4 1.2-1.7zm1.2 1.4c-.4 0-.6.2-.6.5s.2.5.6.5.6-.2.6-.5-.2-.5-.6-.5zm2.4 0c-.4 0-.6.2-.6.5s.2.5.6.5.6-.2.6-.5-.2-.5-.6-.5z"
    />
  );
}

function GiSailboat(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M8 39.2 13.2 51.4h37.6L56 39.2 51.4 37H12.6Zm5.4 4.6h37.2v1.35H13.4zM23.2 14.2h1.7v23.2h-1.7zM34.6 11.4h7.6v16.2h-7.6zM36 14.6h4.8v1.5H36zm0 4.2h4.8v1.5H36z
         M28.4 27.6h18.4v9.6H28.4zM30.6 29.6h3.2v5.8H30.6zm5.4 0h3.2v5.8h-3.2zm5.4 0h3.2v5.8h-3.2z
         M16.6 42.4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm8.6 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm19.2 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z
         M4.8 52.2h54.4v1.6H4.8z"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.85" strokeLinecap="square">
        <path d="M24 16.2 12.4 37.2" />
        <path d="M24.9 16.2 34.4 27.8" />
        <path d="M24.1 22.4 16.8 37" />
        <path d="M38.4 11.4 38.4 8.6" />
        <path d="M12.2 37.4H51.6" />
      </g>
    </Plate>
  );
}

function GiWantedReward(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M12 6h40v52H12zM15.2 9.2h33.6v6.4H15.2zM20.4 20.2h23.2v22.4H20.4zM19.4 48.4h25.2v4.4H19.4z"
    />
  );
}

function GiCargoCrate(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M8 18 32 8l24 10v34L32 56 8 52zM11.2 20.4 32 12.2l20.8 8.2-.2 29.4L32 52.6 11.4 49.6z
         M14 24.2h36v1.6H14zm0 6.2h36v1.6H14zm0 6.2h36v1.6H14zm0 6.2h36v1.6H14z
         M22 22.4h1.7v26.2H22zm18.3 0h1.7v26.2h-1.7z"
    />
  );
}

function GiRadioTower(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M30.6 4.8h2.8v48.8h-2.8zM18 53.2h28v4.4H18zM21.2 20.4h21.6v1.7H21.2zm-3.2 10.2h28v1.7h-28zm-3.4 10.6h34.8v1.7H14.6z
         M22.4 8.6 32 20.8 41.6 8.6 40.2 7.4 32 17.6 23.8 7.4z"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="square">
        <path d="M31.9 5.6 16.4 52.8" />
        <path d="M32.1 5.6 47.6 52.8" />
      </g>
    </Plate>
  );
}

function GiHospital(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M10 58V22l22-14 22 14v36zM14 24.6 32 12.8 50 24.6V54H14z
         M29.2 16.4h5.6v16.8h-5.6zm-5.6 5.6h16.8v5.6H23.6z
         M18.4 36.2h8.2v8.2h-8.2zm19 0h8.2v8.2H37.4zM27.6 48.2h8.8v9.6h-8.8z"
    />
  );
}

function GiWineBottle(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M29.2 4.6h5.6v12.2l6.8 7.4v35.2c0 3.4-3.8 4.8-9.6 4.8s-9.6-1.4-9.6-4.8V24.2l6.8-7.4z
         M30.6 7h2.8v8.4h-2.8zM25.8 26.6h12.4v14.8H25.8z
         M27.4 42.8h9.2v1.4h-9.2zm0 3.4h9.2v1.4h-9.2z"
    />
  );
}

function GiKey(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M18.6 8.4a12.2 12.2 0 0 1 9.8 19.6L56.6 54.2 52 58.8l-6.2-6.2-3.8 3.8-3.4-3.4 3.8-3.8-4.4-4.4-3.6 3.6-3.4-3.4 3.6-3.6-7.2-7.2A12.2 12.2 0 0 1 18.6 8.4z
         M18.6 14.2a6.4 6.4 0 1 0 0 12.8 6.4 6.4 0 0 0 0-12.8z"
    />
  );
}

function GiLockedChest(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M8 26.4c0-10 10.8-16.6 24-16.6s24 6.6 24 16.6V54H8zm4.2.8C12.2 20 20.4 14.8 32 14.8s19.8 5.2 19.8 12.4V50H12.2z
         M10.8 32.6h42.4v2H10.8zM30.2 34.8h3.6v8.2h-3.6zM32 37.2a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z"
    />
  );
}

function GiSecretDoor(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M14 6h36v52H14zM17.4 9.4h29.2v45.2H17.4z
         M20.6 12.8h10.4v16.6H20.6zm12.4 0h10.4v16.6H33zm-12.4 19.4h10.4v16.6H20.6zm12.4 0h10.4v16.6H33z
         M42.6 34.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z"
    />
  );
}

function GiTigerHead(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M12 22 8 10l12 6 12-8 12 8 12-6-4 12c3 4 6 10 4 18-2 10-12 16-24 16S10 50 8 40c-2-8 1-14 4-18z
         M22 18.4 16.6 14 19 22.6zm20-.2 2.4-8.4-5.4 4.6z
         M24.2 28.6c0-2 1.6-3.6 3.6-3.6s3.6 1.6 3.6 3.6-1.6 3.6-3.6 3.6-3.6-1.6-3.6-3.6zm12.4 0c0-2 1.6-3.6 3.6-3.6s3.6 1.6 3.6 3.6-1.6 3.6-3.6 3.6-3.6-1.6-3.6-3.6z
         M24 40.6c2.4 4.2 6.2 6.2 8 6.2s5.6-2 8-6.2C38.4 43.4 35 45 32 45s-6.4-1.6-8-4.4z
         M20.4 24.2 18 32.6h2.2zm23.2 0 2.4 8.4h-2.2z"
    />
  );
}

function GiVial(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M26.4 4.4h11.2v6.2l2.8 2.4v42.6c0 3.2-3.6 4.8-8.4 4.8s-8.4-1.6-8.4-4.8V13l2.8-2.4z
         M28.2 6.2h7.6v3.2h-7.6zM28.6 16.4h6.8v1.5h-6.8zm0 4.6h6.8v1.5h-6.8zm0 4.6h6.8v1.5h-6.8z
         M29.2 38.2h5.6v12.6h-5.6z"
    />
  );
}

function GiLipstick(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M26.2 4.8 37.8 10.4v8.8H26.2zm-1.6 16.2h14.8v10.4H24.6zM23 33.2h18v26.4H23z
         M26.4 8.6h2.2v8.2h-2.2zM26.2 36.4h11.6v1.6H26.2zm0 5.2h11.6v1.6H26.2z"
    />
  );
}

function GiDrowning(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M8 40c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0 4-4 8 0v8H8zm4 3.2c3.2-2.6 6.6-2.6 9.6 0 3.4 2.8 6.8 2.8 10.2 0 3.2-2.6 6.6-2.6 9.6 0 3.4 2.8 6.8 2.8 10.2 0 2.2-1.8 4.4-2.2 6.4-1.4V45H12z
         M28.4 16.2c3.4 0 6 2.4 6 5.6 0 2-1 3.6-2.4 4.6v4.8h-7.2v-4.8c-1.4-1-2.4-2.6-2.4-4.6 0-3.2 2.6-5.6 6-5.6z
         M24.8 32.8h7.2v6.4h-7.2z"
    />
  );
}

function GiCigar(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M6 28.4h40.4c4.2 0 8.8 2.2 11.6 5.6-2.8 3.4-7.4 5.6-11.6 5.6H6zm4.2 3.2v5.2h32.4v-5.2zM44.6 31.2h4.8v7.6h-4.8z"
    />
  );
}

function GiPoliceBadge(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M32 4.8 40.6 10l9.8-1.2-1.4 9.8 6.8 7.4-7.8 5.2.8 10.2-10.2-1.6L32 59.2l-6.6-19.4-10.2 1.6.8-10.2-7.8-5.2 6.8-7.4-1.4-9.8 9.8 1.2z
         M32 11.2 37.4 15l6.4-.8-.9 6.4 4.4 4.8-5.1 3.4.5 6.6-6.6-1L32 47.2l-4.1-12.8-6.6 1 .5-6.6-5.1-3.4 4.4-4.8-.9-6.4 6.4.8z
         M32 24.2a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8z"
    />
  );
}

function GiRevolver(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M6 26.4h28.4l3.2-6.4h16.8l3.6 6.4v6.8H40.6l-2.4 4.8H28.4v12.8h-8.4V38h-4.4l-3.2 6.4H6zm8.4 3.4v3.4h16.2v-3.4zM42.2 23.8h8.8v9.2h-8.8z
         M31.2 28.2a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6z"
    />
  );
}

function GiSpy(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M6 18h52v28H6zM9.2 21.2h45.6v21.6H9.2z
         M32 24.4a8.6 8.6 0 1 1 0 17.2 8.6 8.6 0 0 1 0-17.2zm0 3.4a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4z
         M8.4 16.4h47.2v1.8H8.4zm0 29.4h47.2v1.8H8.4z"
    />
  );
}

function GiMedicalPack(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M8 22.4h48v32.2H8zM12 26.2h40v24.6H12zM22.4 14.8h19.2v9.2H22.4z
         M29.4 32.4h5.2v16.4h-5.2zm-5.6 5.6h16.4v5.2H23.8z"
    />
  );
}

function GiSuitcase(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M8 22.8h48v30.4H8zM12 26.6h40v22.8H12zM22 14.4h20v9.8H22z
         M10.8 36.2h42.4v2H10.8zM16.6 34.4h3.6v5.6h-3.6zm27.2 0h3.6v5.6h-3.6z"
    />
  );
}

function GiFishingHook(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M30.6 4.6h2.8v24.4c8.8.6 15.2 7.2 15.2 16.2 0 9.4-7.4 16.6-18.6 16.6S11.4 54.6 11.4 45.2h4.2c0 6.8 5.6 12.2 14.4 12.2s14.4-5.4 14.4-12.2c0-6.4-4.6-11.2-12.4-11.8V4.6z
         M28.8 6.2h6.4v4.6h-6.4zM42.6 44.2l8.8 8.4-2.4 2.6-8.8-8.4z"
    />
  );
}

function GiPearlNecklace(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M18 14a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z
         M32 8a6.4 6.4 0 1 1 0 12.8A6.4 6.4 0 0 1 32 8zm0 2.4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z
         M46 14a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z
         M12 32a5.6 5.6 0 1 1 0 11.2A5.6 5.6 0 0 1 12 32zm0 2.2a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z
         M32 36a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2z
         M52 32a5.6 5.6 0 1 1 0 11.2A5.6 5.6 0 0 1 52 32zm0 2.2a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z"
    />
  );
}

function GiCrossedPistols(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M10 14 38 42l6-2 8 8-4 4-8-8 2-6-28-28zm6.2 4.4 22.4 22.4 2.6-2.6L18.8 16z
         M54 14 26 42l-6-2-8 8 4 4 8-8-2-6 28-28zm-6.2 4.4L25.4 40.8l-2.6-2.6L45.2 16z"
    />
  );
}

function GiHandcuffs(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M8.4 22.2a13.6 13.6 0 1 1 27.2 0 13.6 13.6 0 0 1-27.2 0zm4.4 0a9.2 9.2 0 1 0 18.4 0 9.2 9.2 0 0 0-18.4 0z
         M28.4 41.8a13.6 13.6 0 1 1 27.2 0 13.6 13.6 0 0 1-27.2 0zm4.4 0a9.2 9.2 0 1 0 18.4 0 9.2 9.2 0 0 0-18.4 0z
         M26.2 28.6h4.2v3.2h-4.2zm7.4 7.4h4.2v3.2h-4.2z"
    />
  );
}

function GiPrisoner(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M12 6h40v52H12zM16 10h32v44H16z
         M21.2 10h2.4v44h-2.4zm6.4 0h2.4v44h-2.4zm6.4 0h2.4v44h-2.4zm6.4 0h2.4v44h-2.4z
         M24.8 22.2c0-4 3.2-7.2 7.2-7.2s7.2 3.2 7.2 7.2-3.2 7.2-7.2 7.2-7.2-3.2-7.2-7.2z"
    />
  );
}

function GiGoldBar(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M8 24.6 16.4 16h31.2L56 24.6v23.2L47.6 56H16.4L8 47.8zM13.2 25.8 18.6 20.2h26.8l5.4 5.6v19.6L45.4 51.6H18.6L13.2 45.4z
         M24.4 30.4h15.2v9.2H24.4z"
    />
  );
}

function GiGavel(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M18.4 8.6 36 26.2l6.4-6.4 8.8 8.8-6.4 6.4 7.6 7.6-5.4 5.4-7.6-7.6-6.4 6.4-8.8-8.8 6.4-6.4L12.6 14zm22.2 16.2 4.2 4.2 3.4-3.4-4.2-4.2z
         M8.4 48.2h28.4v6.4H8.4zM10.6 50.2h24v2.4h-24z"
    />
  );
}

function GiScrollUnfurled(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M14 8.4c-4.4 0-7.2 2.6-7.2 6.2v2.4h6.4v30.8H6.8v2.4c0 3.6 2.8 6.2 7.2 6.2 3 0 5.4-1.2 6.6-3h23.2c1.2 1.8 3.6 3 6.6 3 4.4 0 7.2-2.6 7.2-6.2v-2.4h-6.4V17h6.4v-2.4c0-3.6-2.8-6.2-7.2-6.2-3 0-5.4 1.2-6.6 3H20.6c-1.2-1.8-3.6-3-6.6-3z
         M16.6 17.6h30.8v28.8H16.6zM20.2 22.4h23.6v1.6H20.2zm0 5.4h21.2v1.6H20.2zm0 5.4h23.6v1.6H20.2zm0 5.4h18.8v1.6H20.2zm0 5.4h22.4v1.6H20.2z"
    />
  );
}

function GiSunrise(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M8 40.6c4.8-12.4 13.6-20 24-20s19.2 7.6 24 20H8zM32 24.2c-7.4 0-14 5.2-17.8 13.2h35.6C46 29.4 39.4 24.2 32 24.2z
         M30.6 6.4h2.8v9.2h-2.8zM10.4 16.2 12.4 18l6.4-6.4-2-1.8zM51.6 16.2 49.6 18l-6.4-6.4 2-1.8z
         M6 42.4h52v2.2H6zm3.2 5.2h45.6v2H9.2zm6.4 4.8h32.8v2H15.6z"
    />
  );
}

function GiPocketWatch(props: PlateProps) {
  return (
    <Plate
      {...props}
      d="M24.4 4.8h15.2v5.6h-4.4v4.2C46.8 16.2 54 24.8 54 35.4c0 12.2-9.8 22-22 22s-22-9.8-22-22c0-10.6 7.2-19.2 18.8-20.8V10.4h-4.4z
         M32 18.6c-9.3 0-16.8 7.5-16.8 16.8S22.7 52.2 32 52.2s16.8-7.5 16.8-16.8S41.3 18.6 32 18.6z
         M31.1 22.4h1.8v13.2l8.2 5.2-.9 1.5-9.1-5.8z"
    />
  );
}

export const WOODCUTS: Record<string, (props: PlateProps) => ReactNode> = {
  GiCargoCrate,
  GiCigar,
  GiCrossedPistols,
  GiDrowning,
  GiFishingHook,
  GiGavel,
  GiGoldBar,
  GiHandcuffs,
  GiHospital,
  GiKey,
  GiLipstick,
  GiLockedChest,
  GiMedicalPack,
  GiPearlNecklace,
  GiPocketWatch,
  GiPoisonBottle,
  GiPoliceBadge,
  GiPrisoner,
  GiRadioTower,
  GiRevolver,
  GiSailboat,
  GiScrollUnfurled,
  GiSecretBook,
  GiSecretDoor,
  GiSpy,
  GiSuitcase,
  GiSunrise,
  GiTigerHead,
  GiVial,
  GiWantedReward,
  GiWineBottle,
};

export type PressInk = 'lampblack' | 'cinnabar' | 'prussian' | 'sepia';

export const WOODCUT_INK: Record<string, PressInk> = {
  GiCargoCrate: 'sepia',
  GiCigar: 'sepia',
  GiCrossedPistols: 'cinnabar',
  GiDrowning: 'prussian',
  GiFishingHook: 'lampblack',
  GiGavel: 'prussian',
  GiGoldBar: 'sepia',
  GiHandcuffs: 'prussian',
  GiHospital: 'sepia',
  GiKey: 'sepia',
  GiLipstick: 'cinnabar',
  GiLockedChest: 'prussian',
  GiMedicalPack: 'lampblack',
  GiPearlNecklace: 'sepia',
  GiPocketWatch: 'sepia',
  GiPoisonBottle: 'cinnabar',
  GiPoliceBadge: 'prussian',
  GiPrisoner: 'cinnabar',
  GiRadioTower: 'prussian',
  GiRevolver: 'cinnabar',
  GiSailboat: 'lampblack',
  GiScrollUnfurled: 'sepia',
  GiSecretBook: 'sepia',
  GiSecretDoor: 'prussian',
  GiSpy: 'prussian',
  GiSuitcase: 'sepia',
  GiSunrise: 'lampblack',
  GiTigerHead: 'cinnabar',
  GiVial: 'prussian',
  GiWantedReward: 'cinnabar',
  GiWineBottle: 'lampblack',
};
