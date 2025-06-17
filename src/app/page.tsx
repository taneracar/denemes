import ScrollAnimation from "@/components/ustUsteGelme/ScrollAnimation";

//import ScrollAnimation from "@/components/stacking";

export default function Home() {
  return (
    <>
      <div className="flex justify-center items-center h-screen bg-amber-200">
        <h1 className="text-3xl text-orange-500 font-extrabold items-center">
          Taner
        </h1>
      </div>
      <ScrollAnimation />
      {/* <ScrollAnimation /> */}
    </>
  );
}
