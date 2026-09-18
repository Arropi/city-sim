"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus } from "lucide-react";
import BackButton from "./back-button";

export default function Form() {
    const [ownerName, setOwnerName] = useState("");
    const [ownerNik, setOwnerNik] = useState("");
    const [address, setAddress] = useState("");
    const [buildingCondition, setBuildingCondition] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Browser Anda tidak mendukung fitur geolokasi GPS.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setIsLocating(false);
            },
            (error) => {
                console.error("Gagal mendapatkan lokasi GPS:", error);
                alert(`Gagal mengakses GPS (${error.message}). Pastikan izin lokasi telah diizinkan.`);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const validateAndSetFile = (selectedFile: File) => {
        const validTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!validTypes.includes(selectedFile.type)) {
            alert("Format file tidak didukung. Harap pilih gambar dengan format PNG, JPG, atau JPEG.");
            return;
        }

        const maxSizeBytes = 5 * 1024 * 1024; // 5MB
        if (selectedFile.size > maxSizeBytes) {
            alert("Ukuran gambar melebihi 5MB. Silakan gunakan foto yang lebih kecil.");
            return;
        }

        setFile(selectedFile);
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!ownerName.trim()) {
            alert("Nama pemilik rumah wajib diisi.");
            return;
        }

        if (!coords) {
            alert("Akses lokasi diperlukan. Silakan klik 'Aktifkan GPS' terlebih dahulu.");
            return;
        }

        try {
            setIsSubmitting(true);

            const formData = new FormData();
            formData.append("owner_name", ownerName.trim());
            if (ownerNik.trim()) formData.append("owner_nik", ownerNik.trim());
            if (address.trim()) formData.append("address", address.trim());
            if (buildingCondition.trim()) formData.append("building_condition", buildingCondition.trim());
            formData.append("latitude", coords.latitude.toString());
            formData.append("longitude", coords.longitude.toString());
            if (file) {
                formData.append("file", file);
            }

            const res = await fetch("/reports", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || data.error?.message || "Gagal mengirim laporan");
            }

            alert("Laporan berhasil dikirim dan tersimpan!");

            // Reset form
            setOwnerName("");
            setOwnerNik("");
            setAddress("");
            setBuildingCondition("");
            setFile(null);
            setPreviewUrl(null);
        } catch (err: unknown) {
            console.error("Gagal mengirim laporan:", err);
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim laporan.";
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen py-5 px-10 overflow-y-auto">
            <form
                onSubmit={handleSubmit}
                action="/reports"
                method="POST"
                className="bg-neutral box-shadow-custom rounded-xl overflow-hidden"
            >
                <div className="px-10 pt-6 pb-4">
                    <BackButton />
                </div>
                <div className="py-2 px-10">
                    <div className="flex justify-between items-center bg-[#46843226] py-3 px-5 rounded-xl">

                    <h1 className="text-primary-500 font-bold text-body-1">
                        {coords
                            ? `Lokasi Terdeteksi (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)})`
                            : "Akses Lokasi Diperlukan"}
                    </h1>
                    <Button
                        type="button"
                        variant={"yellow"}
                        size={"sm"}
                        onClick={handleGetLocation}
                        disabled={isLocating}
                    >
                        {isLocating ? "Mencari GPS..." : coords ? "Perbarui GPS" : "Aktifkan GPS"}
                    </Button>
                    </div>
                </div>
                <div className="px-10 pt-2 pb-5 flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 flex flex-col">
                        <h1 className="font-semibold text-base mb-2">Foto Kondisi Rumah</h1>
                        <label
                            htmlFor="upload-image"
                            className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-center p-6 bg-[#F7F7F7] border-2 border-dashed border-neutral-700 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="upload-image"
                                name="file"
                                className="hidden"
                                accept="image/png,image/jpeg,image/jpg"
                                onChange={handleFileChange}
                            />
                            {previewUrl ? (
                                <div className="flex flex-col items-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={previewUrl}
                                        alt="Preview Kondisi Rumah"
                                        className="max-h-40 object-contain rounded-lg mb-2"
                                    />
                                    <p className="text-sm text-neutral-700 font-medium">
                                        {file?.name}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Klik untuk ganti file
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <ImagePlus className="size-10 text-neutral-600 mb-3" />
                                    <p className="text-sm text-neutral-700">
                                        Drag &amp; Drop foto disini, atau{" "}
                                        <span className="text-accent-400 font-semibold underline underline-offset-2">
                                            pilih file
                                        </span>
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        PNG, JPG, atau JPEG (maks. 5MB)
                                    </p>
                                </>
                            )}
                        </label>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="nama-lengkap" className="text-sm font-medium">
                                Nama Pemilik Rumah
                            </label>
                            <Input
                                id="nama-lengkap"
                                name="owner_name"
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                                placeholder="Masukkan Nama Lengkap"
                                className="bg-neutral-200 border-none"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="nik-pemilik" className="text-sm font-medium">
                                NIK Pemilik Rumah
                            </label>
                            <Input
                                id="nik-pemilik"
                                name="owner_nik"
                                value={ownerNik}
                                onChange={(e) => setOwnerNik(e.target.value)}
                                placeholder="16 digit NIK"
                                className="bg-neutral-200 border-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="alamat" className="text-sm font-medium">
                                Alamat Lengkap
                            </label>
                            <Input
                                id="alamat"
                                name="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Nama jalan, RT/RW, dusun"
                                className="bg-neutral-200 border-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="kondisi-bangunan" className="text-sm font-medium">
                                Kondisi Bangunan / Catatan
                            </label>
                            <Textarea
                                id="kondisi-bangunan"
                                name="building_condition"
                                value={buildingCondition}
                                onChange={(e) => setBuildingCondition(e.target.value)}
                                placeholder="Masukkan kondisi bangunan atau catatan Anda"
                                className="bg-neutral-200 min-h-24 border-none"
                            />
                        </div>
                        <Button
                            type="submit"
                            variant={"orange"}
                            size={"sm"}
                            className="self-end"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Mengirim..." : "Kirim"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}