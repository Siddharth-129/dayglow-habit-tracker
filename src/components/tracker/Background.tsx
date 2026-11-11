export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-aurora-a absolute -left-[10%] -top-[20%] h-[55vh] w-[55vw] rounded-full bg-lime opacity-[0.13] blur-[120px]" />
      <div className="animate-aurora-b absolute -right-[10%] top-[10%] h-[50vh] w-[45vw] rounded-full bg-coral opacity-[0.12] blur-[120px]" />
      <div className="animate-aurora-c absolute bottom-[-20%] left-[25%] h-[50vh] w-[50vw] rounded-full bg-sky opacity-[0.1] blur-[130px]" />
      <div className="grid-lines absolute inset-0" />
      <div className="grain" />
    </div>
  );
}
