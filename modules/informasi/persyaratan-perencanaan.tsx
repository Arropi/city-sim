import { MapPin, Building, ChevronRight } from "lucide-react";

export default function PersyaratanPerencanaan() {
  return (
    <div className="p-1">
      <h1 className="font-bold text-body-4 mb-3">Persyaratan Perencanaan</h1>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Div 1: Lokasi */}
        <div className="bg-neutral-100 box-shadow-custom rounded-2xl p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="size-5 text-neutral-800 shrink-0" />
            <h1 className="font-bold text-body-3 md:text-base text-black">Lokasi</h1>
          </div>

          <div className="flex items-center gap-1.5 font-normal text-body-4 md:text-sm text-neutral-900 mb-1.5">
            <ChevronRight className="size-4 text-neutral-700 shrink-0" />
            <span>Keamanan lokasi diantaranya:</span>
          </div>
          <ul className="list-disc list-outside pl-6 text-body-4 text-neutral-600 space-y-1 mb-4">
            <li>bukan merupakan kawasan lindung</li>
            <li>bukan merupakan kawasan budidaya</li>
            <li>bukan merupakan hutan produksi</li>
            <li>bukan merupakan daerah buangan limbah</li>
            <li>
              bukan merupakan daerah sempadan sungai, sempadan kereta api,
              sempadan danau, sempadan laut, atau daerah lintasan pesawat
            </li>
          </ul>

          <div className="flex items-center gap-1.5 font-normal text-body-4 md:text-sm text-neutral-900 mb-1.5">
            <ChevronRight className="size-4 text-neutral-700 shrink-0" />
            <span>
              Lokasi tidak berada pada daerah yang melebihi ambang batas untuk:
            </span>
          </div>
          <ul className="list-disc list-outside pl-6 text-body-4 text-neutral-600 space-y-1">
            <li>pencemaran udara</li>
            <li>pencemaran air permukaan dan air tanah dalam</li>
            <li>pencemaran tanah</li>
            <li>pencemaran suara (kebisingan suara)</li>
          </ul>
        </div>

        {/* Div 2: Perencanaan Fisik */}
        <div className="bg-neutral-100 box-shadow-custom rounded-2xl p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Building className="size-5 text-neutral-800 shrink-0" />
            <h1 className="font-bold text-body-3 md:text-base text-black">
              Perencanaan Fisik
            </h1>
          </div>

          <ul className="list-disc list-outside pl-6 text-body-4 font-normal text-neutral-600 space-y-2 mt-1">
            <li>
              Ketinggian lahan tidak boleh berada di bawah permukaan air setempat,
              kecuali melalui rekayasa atau penyelesaian teknis;
            </li>
            <li>
              Ketinggian lantai bangunan minimum 20 cm di atas ketinggian muka
              jalan lingkungan dan minimum 15 cm di atas halaman depan bangunan;
            </li>
            <li>
              Perumahan dan permukiman pada kawasan berkontur harus disertai
              rekayasa lahan berdasarkan kondisi geoteknik dan topografi;
            </li>
            <li>
              Bangunan yang menghadap kontur yang lebih tinggi dilengkapi saluran
              drainase pada bagian yang sejajar dengan dinding;
            </li>
            <li>
              Jarak bangunan dengan bibir kontur yang lebih rendah harus
              memperhatikan jarak aman dengan mempertimbangkan ketinggian kontur,
              jenis dan kekuatan tanah, ketinggian muka air tanah, bidang
              gelincir, beban bangunan di atas lereng, serta sistem drainase
              lingkungan;
            </li>
            <li>
              Kesesuaian peruntukan lahan berdasarkan kemiringan lereng perumahan
              0–15% dengan memperhitungkan keandalan lereng melalui analisis
              stabilitas lereng sesuai SNI 8460 yang didahului dengan penyelidikan
              tanah;
            </li>
            <li>
              Memperhatikan kriteria tata bangunan (koefisien dasar bangunan,
              koefisien lantai bangunan, ketinggian, dan jarak bebas bangunan)
              sesuai dengan peraturan yang berlaku.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
