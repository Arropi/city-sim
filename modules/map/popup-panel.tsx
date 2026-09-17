"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoIcon } from "lucide-react";
import { INFORMASI_PERUMAHAN_ITEMS } from "@/constants/helper";

export default function PopupPanel() {
  return (
    <>
      <Dialog>
        <DialogTrigger
          render={
            <Button className={"bg-white box-shadow-custom border-none text-body-3 font-normal hover:bg-neutral-200"}>
              <InfoIcon className="text-secondary-400" />
              Informasi Perumahan
            </Button>
          }
        ></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={'flex gap-1 items-center'}>
              <InfoIcon />
              <span>Informasi Umum</span>
            </DialogTitle>
            <DialogDescription render={<div />}>
              <ol className="list-decimal list-outside pl-5 space-y-1.5 text-sm text-muted-foreground mt-2">
                {INFORMASI_PERUMAHAN_ITEMS.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </DialogDescription>
          </DialogHeader>
          <div
            className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 overscroll-contain transform-gpu [will-change:scroll-position]"
            onWheel={(e) => e.stopPropagation()}
          >
            {Array.from({ length: 10 }).map((_, index) => (
              <p key={index} className="mb-4 leading-normal">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
