import { House, UserRound } from "lucide-react";

export default function LuasLantaiRuang() {
  return (
    <div className="p-1">
      <h1 className="font-bold text-lg mb-3">Luas Lantai Ruang</h1>
      <div className="bg-neutral-100 box-shadow-custom rounded-2xl p-5 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Div 1: flex-col dengan 2 item icon di tengah sesuai keterangan sebelahnya */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="shrink-0 size-8 rounded-full flex items-center justify-center bg-[#34C7591A]">
              <House className="size-4 text-[#34C759]" />
            </div>
            <div className="flex flex-col">
              <p className="font-bold text-sm text-black">21m²</p>
              <p className="text-xs text-neutral-600">Luas minimum persegi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="shrink-0 size-8 rounded-full flex items-center justify-center bg-[#34C7591A]">
              <UserRound className="size-4 text-[#34C759]" />
            </div>
            <div className="flex flex-col">
              <p className="font-bold text-sm text-black">+7m²</p>
              <p className="text-xs text-neutral-600">Untuk setiap penghuni tambahan</p>
            </div>
          </div>
        </div>

        {/* Div 2: Lebih lebar, judul standar luas lantai di-bold */}
        <div className="flex flex-col gap-2 flex-1">
          <h2 className="font-bold text-sm md:text-base text-black">
            Standar luas lantai ruang dalam minimum
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Luas lantai ruang dalam minimum untuk satu penghuni yaitu 21 m² dan 7 m² per penghuni tambahan.
          </p>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Luas ini belum termasuk luas balkon, teras, area bersama, koridor publik, serta fasilitas penunjang lainnya.
          </p>
        </div>
      </div>
    </div>
  );
}
