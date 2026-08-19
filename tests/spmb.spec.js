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
