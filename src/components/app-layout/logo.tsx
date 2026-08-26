import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/logo.png"
      width={32}
      height={32}
      className="me-1 size-8 rounded-[5px] transition-all group-data-collapsible:size-6 group-data-[collapsible=icon]:size-8"
      alt="shadcn ui kit png logo"
    />
  );
}
