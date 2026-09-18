"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";

interface SubItemProps {
  title: string;
  items: string[];
}

function SubColumn({ title, items }: SubItemProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-bold text-xs md:text-sm text-black">{title}</h3>
      <div className="flex flex-col gap-1.5">
        {items.map((text, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-xs text-neutral-600"
          >
            <ArrowRight className="size-3.5 text-neutral-500 shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailContent({data}: {
  data: SubItemProps[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-neutral-100/90 box-shadow-custom rounded-xl border border-neutral-200/50 mt-1">
      {data.map((item, idx) => (
        <SubColumn key={idx} title={item.title} items={item.items} />
      ))}
    </div>
  );
}

const ACCORDION_ITEMS = [
  {
    id: "item-a",
    title: "A. Jalan & perlengkapan keselamatan lalu lintas",
    content: [
      {
        title: "1. Sistem jaringan jalan",
        items: [
          "Kriteria kecepatan",
          "Kriteria teknis geometri dan konstruksi perkerasan",
        ],
      },
      {
        title: "2. Jalur pejalan kaki & Penyebrangan",
        items: ["Trotoar", "Ramp", "Jalur Pemandu", "Pegangan tangan/handrail"],
      },
      {
        title: "3. Perlengkapan keselamatan lalu lintas",
        items: [
          "Rambu Lalu Lintas",
          "Marka Jalan",
          "Penerangan Jalan",
          "Alat Pengendali Pengguna Jalan",
          "Alat Pengaman Pengguna Jalan",
        ],
      },
    ],
  },
  {
    id: "item-b",
    title: "B. Sistem penyediaan air minum",
    content: [
      {
        title: "1. Sumber air",
        items: ["Jaringan Perpipaan (JP)", "Bukan Jaringan Perpipaan"],
      },
      {
        title: "2. Kebutuhan air minum",
        items: [
          "Kriteria kebutuhan air minum berdasarkan jenis fungsi bangunan",
        ],
      },
      {
        title: "3. Unit SPAM",
        items: [
          "Kriteria unit baku",
          "Kriteria unit pengolahan",
          "Kriteria unit distribusi dan pelayanan",
        ],
      },
      {
        title: "Kualitas air minum",
        items: ["Kriteria baku mutu kualitas air minum"],
      },
    ],
  },
  {
    id: "item-c",
    title: "C. Sistem drainase",
    content: [
      {
        title: "1. Saluran lokal/Saluran air hujan",
        items: [
          "Tidak bersatu dengan jaringan air limbah",
          "Tidak boleh terputus",
          "Tersambung dengan saluran kota",
          "Kemiringan saluran minimum 2%",
          "Pada saluran tertutup dilengkapi dengan lubang pemeriksa (manhole) di setiap belokan dan dibuat jarak maksimum per 50m",
        ],
      },
      {
        title: "2. Saluran lokal/Saluran air hujan",
        items: [
          "Tidak bersatu dengan jaringan air limbah",
          "Tidak boleh terputus",
          "Tersambung dengan saluran kota",
          "Kemiringan saluran minimum 2%",
          "Pada saluran tertutup dilengkapi dengan lubang pemeriksa (manhole) di setiap belokan dan dibuat jarak maksimum per 50m",
        ],
      },
    ],
  },
  {
    id: "item-d",
    title: "D. Pengelolaan air limbah",
    content: [
      {
        title: "1. Jenis Sistem Pengelolaan Air Limbah Domestik",
        items: [
          "Kriteria kapasitas pengolahan",
          "Kriteria jenis pengolahan",
          "Kriteria penyediaan oleh pengelola kawasan perumahan dan permukiman menuju IPLT",
          "Untuk SPALD Terpusat: kriteria cakupan pelayanan: 50 orang s.d. 20.000 orang",
        ],
      },
      {
        title: "2. Timbulan Air Limbah Domestik",
        items: [
          "Kriteria timbulan air limbah domestik: 70% sampai dengan 80% dari konsumsi kebutuhan air minum",
        ],
      },
      {
        title: "3. Kualitas efluen",
        items: ["Kriteria baku mutu kualitas efluen hasil olahan air limbah"],
      },
    ],
  },
  {
    id: "item-e",
    title: "E. Pengelolaan persampahan",
    content: [
      {
        title: "1. Pola Penanganan Sampah",
        items: [
          "Kriteria pemilahan",
          "Kriteria pengangkutan",
          "Kriteria pengolahan",
        ],
      },
      {
        title: "2. Timbulan Sampah",
        items: [
          "Kriteria timbulan sampah: (2,5 s.d. 3) liter per orang per hari atau (0,70 s.d. 0,80) kilogram per orang per hari",
        ],
      },
    ],
  },
  {
    id: "item-f",
    title: "F. Mitigasi Bencana",
    content: [
      {
        title: "1. Titik Kumpul",
        items: [
          "Kriteria penyediaan untuk risiko bencana banjir dan angin puting beliung",
          "Kriteria penyediaan untuk risiko bencana kebakaran, gunung meletus dan gempa bumi",
        ],
      },
      {
        title: "2. Jalur Evakuasi",
        items: [
          "Kriteria jalur evakuasi untuk perumahan dan permukiman yang memiliki resiko terhadap bencana tsunami dan gunung meletus",
          "Kriteria lebar jalan minimum untuk jalur evakuasi primer",
          "Kriteria lebar jalan minimum untuk jalur evakuasi sekunder"
        ],
      },
    ],
  },
  {
    id: "item-g",
    title: "G. Proteksi Kebakaran",
    content: [
      {
        title: "1. Lingkungan bangunan gedung",
        items: [
          "Kriteria penyediaan akses, perkerasan, dimensi, dan jarak minimum antar gedung"
        ] 
      },
      {
        title: "2. Kawasan",
        items:[
          "Kriteria sumber pasokan air",
          "Kriteria penyediaan hidran (jarak, radius, dan penempatan)",
          "Kriteria jika tidak tersedia jaringan perpipaan air minum"
        ]
      },
    ]
  },
  {
    id: "item-h",
    title: "H. Ketenagalistrikan",
    content: [{
      title: "1. Pembangkit tenaga listrik",
      items: [
        "Penyediaan tenaga listrik untuk di dalam kawasan",
        "Penyediaan tenaga listrik dari luar kawasan"
      ]
    },
    {
      title: "2. Jaringan Distribusi Listrik",
      items: [
        "Kriteria daya listrik",
        "Pemilihan jenis gardu",
        "Lokasi penempatan gardu"
      ]
    }
  ]
  },
];

export default function PrasaranaUtilitasUtama() {
  return (
    <div className="">
      <h1 className="font-bold text-lg mb-3">Prasarana Utilitas Utama</h1>
      <Accordion
        multiple
        defaultValue={["item-a"]}
        className="flex flex-col gap-3 px-1"
      >
        {ACCORDION_ITEMS.map((item) => (
          <AccordionItem key={item.id} value={item.id} className="border-none">
            <AccordionTrigger className="w-full bg-white hover:bg-neutral-50 transition-colors border-none box-shadow-custom lg:py-2.5 px-4 py-3 rounded-xl hover:no-underline items-center cursor-pointer">
              <ItemTitle className="text-body-3 font-black text-black">
                {item.title}
              </ItemTitle>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-1 px-1">
              <DetailContent data={item.content} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Item className="bg-[#46843226] border-none box-shadow-custom rounded-xl px-4 py-3 mt-4 flex-nowrap items-start sm:items-center justify-between gap-3">
        <ItemMedia>
          <Info className="size-5 text-primary-500 shrink-0" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="font-bold text-sm text-neutral-900">
            Catatan Penting
          </ItemTitle>
          <ItemDescription className="text-xs text-neutral-700 line-clamp-none">
            Seluruh persyaratan di atas mengacu pada Rencana Detail Tata Ruang
            Wilayah, Rencana Tata Bangunan dan Lingkungan, serta peraturan yang
            berlaku.
          </ItemDescription>
        </ItemContent>
        <ItemActions className="shrink-0 self-end sm:self-center">
          <Button variant={"yellow"} size={"sm"}>
            Lihat Peraturan
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
}
