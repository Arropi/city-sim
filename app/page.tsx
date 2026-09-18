import Home from "@/modules/home";
import { getCities } from "@/app/map/[slugid]/actions";

export default async function Page() {
  const cities = await getCities();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white h-screen overflow-hidden">
      <Home initialCities={cities} />
    </div>
  );
}

