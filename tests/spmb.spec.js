const { test, expect } = require('@playwright/test');
const baseURL = 'http://localhost:3000';

  test('Test Login Admin & Halaman Penentuan Kelulusan (Admin SPMB)', async ({ page }) => {
    // 1. Kunjungi halaman Login
    await page.goto(`${baseURL}/login`);
    
    // 2. Lakukan proses Login
    // Asumsikan elemen input menggunakan placeholder atau name
    const emailInput = page.locator('#login-identifier');
    const passwordInput = page.locator('#login-password');
    const loginButton = page.locator('#btn-login');

    // Jika input tidak ditemukan dengan type, coba cara general
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('superadmin@campus.ac.id');
    await passwordInput.fill('password');
    await loginButton.click();

    // 3. Kunjungi halaman Seleksi SPMB
    await page.goto(`${baseURL}/spmb/seleksi`);

    // 4. Pastikan halaman dirender dengan benar
    await expect(page.locator('text=Penentuan Kelulusan')).toBeVisible({ timeout: 10000 });

    // 5. Pastikan Filter Drawer bisa dibuka
    const filterBtn = page.locator('button:has-text("Filter Data")');
    if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await expect(page.locator('text=Status Kelulusan')).toBeVisible();
        await page.keyboard.press('Escape');
    }

    // 6. Pastikan tabel dirender
    await expect(page.locator('table')).toBeVisible();

});

  test('Test Form Registrasi SPMB - Field Baru Terender', async ({ page }) => {
    // 1. Login dulu
    await page.goto(`${baseURL}/login`);
    await page.locator('#login-identifier').fill('calonmhs@test.com');
    await page.locator('#login-password').fill('password');
    await page.locator('#btn-login').click();

    // 2. Navigate ke halaman registrasi
    await page.goto(`${baseURL}/spmb/registrasi`);
    
    // 3. Pastikan halaman form registrasi tampil
    await expect(page.locator('text=Jalur Masuk')).toBeVisible({ timeout: 10000 });

    // 4. Step 1: Verifikasi field Jenis Pendaftaran & Kelas
    await expect(page.locator('label:has-text("Jenis Pendaftaran")')).toBeVisible();
    await expect(page.locator('label:has-text("Kelas")')).toBeVisible();

    // 5. Lanjut ke Step 2 (Biodata) - isi step 1 dulu
    // Pilih jalur jika ada opsi
    const jalurSelect = page.locator('div.react-select-container').first();
    if (await jalurSelect.isVisible()) {
      await jalurSelect.click();
      await page.keyboard.press('Enter');
    }
    
    // Klik Lanjut
    await page.locator('button:has-text("Lanjut")').click();
    
    // 6. Step 2: Verifikasi field Status Sipil
    await expect(page.locator('label:has-text("Status Sipil")')).toBeVisible({ timeout: 5000 });
    
    // 7. Lanjut ke Step 4 (Akademik) - isi step 2 & 3
    // Isi biodata
    await page.locator('input[placeholder*="ijazah"]').fill('Budi Santoso');
    await page.locator('input[placeholder*="NIK"]').fill('1234567890123456');
    await page.locator('input[placeholder*="Kota"]').fill('Jakarta');
    await page.locator('input[type="date"]').fill('2000-01-01');
    
    await page.locator('button:has-text("Lanjut")').click();
    
    // Step 3: Isi kontak
    await page.locator('input[placeholder*="0812"]').fill('081234567890');
    await page.locator('input[placeholder*="Provinsi"]').fill('Jawa Tengah');
    await page.locator('input[placeholder*="Kota"]').fill('Surakarta');
    await page.locator('input[placeholder*="Kecamatan"]').fill('Laweyan');
    await page.locator('textarea').first().fill('Jl. Contoh No. 123');
    
    await page.locator('button:has-text("Lanjut")').click();
    
    // 8. Step 4: Verifikasi field Alamat Sekolah
    await expect(page.locator('label:has-text("Alamat Sekolah")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('textarea[placeholder*="Jalan, RT"]')).toBeVisible();
    
    // Isi data sekolah
    await page.locator('input[placeholder*="SMAN"]').fill('SMAN 1 Surakarta');
    await page.locator('textarea[placeholder*="Jalan, RT"]').fill('Jl. Sekolah No. 1');
    await page.locator('input[placeholder*="IPA"]').fill('IPA');
    await page.locator('input[placeholder*="2024"]').fill('2024');
    
    await page.locator('button:has-text("Lanjut")').click();
    
    // 9. Step 5: Verifikasi field Orang Tua & Info
    await expect(page.locator('label:has-text("Nama Orang Tua")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('label:has-text("Alamat Orang Tua")')).toBeVisible();
    await expect(page.locator('label:has-text("No. Telepon / HP Orang Tua")')).toBeVisible();
    await expect(page.locator('label:has-text("Info Pendaftaran")')).toBeVisible();
    await expect(page.locator('label:has-text("Keterangan Info")')).toBeVisible();
    
    // Isi data orang tua
    await page.locator('input[placeholder*="Orang Tua"]').first().fill('Ayah Budi');
    await page.locator('input[placeholder*="0812"]').first().fill('081298765432');
    await page.locator('textarea[placeholder*="Alamat lengkap"]').fill('Jl. Ortu No. 456');
    await page.locator('input[placeholder*="Ayah"]').fill('Ayah Budi');
    await page.locator('input[placeholder*="Ibu"]').fill('Ibu Budi');
    
    // Info pendaftaran - pilih dari dropdown
    const infoSelect = page.locator('div.react-select-container').nth(2);
    if (await infoSelect.isVisible()) {
      await infoSelect.click();
      await page.keyboard.press('Enter');
    }
    await page.locator('input[placeholder*="sumber info"]').fill('Dari teman');
    
    // Verify button Lanjut exists
    await expect(page.locator('button:has-text("Lanjut")')).toBeVisible();
  });

