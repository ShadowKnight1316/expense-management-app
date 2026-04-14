package com.customerwebapp.pages;

import com.microsoft.playwright.*;

import java.util.List;

public class LoginPage {

    private Page page;

    // Constructor
    public LoginPage(Page page) {
        this.page = page;
    }

    private Locator mobileNumber() {
        return page.locator("//input[contains(@id,'phone')]");
    }
    private Locator loginViaCustIdLink() {
        return page.locator("//span[contains(text(),'Login via Cust ID')]");
    }
    private Locator custIdField() {
        return page.locator("#custId");
    }
    private Locator mpinFields() {
        return page.locator("//input[@type='tel']");
    }
    private Locator submitButton() {
        return page.locator("//button[@type='submit']");
    }
    private Locator proceedButton() {
        return page.locator("//button[normalize-space()='Proceed']");
    }
    private Locator requestOtpButton() {
        return page.locator("//button[contains(text(),'Request OTP')]");
    }
    private Locator viewButton() {
        return page.locator("//a[contains(text(),'VIEW')]");
    }
    private Locator logoutButton() {
        return page.locator("//div[contains(@class,'cursor-pointer')]//*[name()='svg']");
    }
    private Locator okButton() {
        return page.locator("//button[contains(text(),'OK')]");
    }
    private Locator invalidCustIdError() {
        return page.locator("//div[contains(text(),'Please enter valid credentials')]");
    }
    private Locator remindMeLaterButton() {
        return page.locator("//button[contains(text(),'Remind me later')]");
    }
    private Locator homeButton() {
        return page.locator("//span[normalize-space(text())='Home']");
    }
    private Locator skipNowButton() {
        return page.locator("//button[contains(text(),'Skip for now')]");
    }
    private Locator invalidOtp() {
        return page.locator("//div[contains(text(),'Invalid otp')]");
    }
    private Locator invalidMpin() {
        return page.locator("//div[contains(@class,'text-red-500')]");
    }
    private Locator inprogressLoanMessage() {
        return page.locator("//div[contains(@class,'px-3 pt-7')]");
    }
    public void navigate(String url) {
        page.navigate(url);
    }
    public void enterMobileNumber(String number) {
        mobileNumber().fill(number);
        submitButton().click();
    }
    public void clickLoginViaCustId() {
        loginViaCustIdLink().click();
    }
    public void enterCustomerId(String custId) {
        custIdField().fill(custId);
    }
    public void clickSubmit() {
        submitButton().click();
    }
    public void clickRequestOtp() {
        if (requestOtpButton().isVisible()) {
            requestOtpButton().click();
        }
    }
    public void enterOTP(String otp) {
        Locator fields = mpinFields();
        for (int i = 0; i < otp.length(); i++) {
            fields.nth(i).fill(String.valueOf(otp.charAt(i)));
        }
    }
    public void enterMPIN(String mpin) {
        Locator fields = mpinFields();
        for (int i = 0; i < mpin.length(); i++) {
            fields.nth(i).fill(String.valueOf(mpin.charAt(i)));
        }
    }
    public void clickProceed() {
        proceedButton().click();
    }
    public void clickView() {
        viewButton().click();
    }
    public void logout() {
        logoutButton().click();
        okButton().click();
    }
    public void clickHome() {
        homeButton().click();
    }
    public void handleReminderPopupIfPresent() {
        if (remindMeLaterButton().count() > 0 &&
                remindMeLaterButton().first().isVisible()) {
            remindMeLaterButton().first().click();
        }
    }

    public void handleRenewalPopupIfPresent() {
        Locator renewalBtn = page.locator("//button[contains(text(),\"I'll do this later\")]");
        if (renewalBtn.count() > 0 && renewalBtn.first().isVisible()) {
            renewalBtn.first().click();
        }
    }

    // ==========================
    // Validations
    // ==========================

    public boolean isInvalidCustIdDisplayed() {
        return invalidCustIdError().isVisible();
    }

    public boolean isInvalidOtpDisplayed() {
        return invalidOtp().isVisible();
    }

    public boolean isInvalidMpinDisplayed() {
        return invalidMpin().isVisible();
    }

    public boolean isInprogressLoanDisplayed() {
        return inprogressLoanMessage().isVisible();
    }

    public boolean isLoggedOut() {
        return page.url().contains("login");
    }

    public String getPageTitle() {
        return page.title();
    }
}