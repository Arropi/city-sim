import LuasLantaiRuang from "@/modules/informasi/luas-lantai-ruang";
import PersyaratanPerencanaan from "@/modules/informasi/persyaratan-perencanaan";
import PrasaranaUtilitasUtama from "@/modules/informasi/prasarana-utilitas-utama";
import BackButton from "@/modules/pendataan/back-button";

export default function Page() {
  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 w-fit flex flex-col gap-3">
        <BackButton />
        <h1 className=" text-heading-6 font-bold">INFORMASI PERUMAHAN</h1>
      </div>
      <div className="h-screen px-4 py-2 grid grid-cols-1 md:grid-cols-10 gap-4">
        {/* Kolom Kiri: 6/10 dari lebar grid, tetap / tidak scroll */}
        <div className="md:col-span-6 flex flex-col gap-1">
          <LuasLantaiRuang />
          <PersyaratanPerencanaan />
        </div>

        {/* Kolom Kanan: 4/10 dari lebar grid, Prasarana Utilitas bisa di-scroll */}
        <div className="md:col-span-4 flex flex-col h-full min-h-0 overflow-y-auto pr-2 pb-4">
          <PrasaranaUtilitasUtama />
        </div>
      </div>
    </div>
  );
}
