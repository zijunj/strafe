import News from "../components/News";
export default function NewsPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto flex items-center">
        <img src="/valorantLogo.png" alt="Valorant Logo" className="h-[48px]" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Valorant Esports News
          </h1>
          <p className="text-gray-300">
            Read up on the latest in Valorant esports.
          </p>
        </div>
      </div>
      <News />
    </>
  );
}
