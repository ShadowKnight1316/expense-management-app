package com.customerwebapp.tests;

import com.customerwebapp.base.BaseTest;
import com.customerwebapp.pages.LoginPage;
import org.testng.Assert;
import org.testng.annotations.Test;
public class LoginTest extends BaseTest {
    @Test(priority = 1)
    public void loginWithMobileAndOTP() {
        LoginPage loginPage = new LoginPage(page);
        loginPage.navigate("https://app.test.mintifi.com/login");
        loginPage.enterMobileNumber("9876543210");
        loginPage.enterOTP("111111");
        loginPage.clickProceed();
        Assert.assertTrue(
                loginPage.isInprogressLoanDisplayed()
                        || loginPage.getPageTitle().contains("Home"),
                "Login failed"
        );
    }
    @Test(priority = 2)
    public void loginWithCustomerIdAndMPIN() {
        LoginPage loginPage = new LoginPage(page);
        loginPage.navigate("https://app.test.mintifi.com/login");
        loginPage.clickLoginViaCustId();
        loginPage.enterCustomerId("CAT338");
        loginPage.clickSubmit();
        loginPage.enterMPIN("1111");
        Assert.assertTrue(
                loginPage.getPageTitle().contains("Home"),
                "Login failed using MPIN"
        );
    }
    @Test(priority = 3)
    public void invalidCustomerIdTest() {
        LoginPage loginPage = new LoginPage(page);
        loginPage.navigate("https://app.test.mintifi.com/login");
        loginPage.clickLoginViaCustId();
        loginPage.enterCustomerId("INVALID123");
        loginPage.clickSubmit();
        Assert.assertTrue(
                loginPage.isInvalidCustIdDisplayed(),
                "Invalid Customer ID message not displayed"
        );
    }
    @Test(priority = 4)
    public void logoutTest() {
        LoginPage loginPage = new LoginPage(page);
        loginPage.navigate("https://app.test.mintifi.com/login");
        loginPage.enterMobileNumber("9876543210");
        loginPage.enterOTP("123456");
        loginPage.clickProceed();
        loginPage.clickView();
        loginPage.logout();
        Assert.assertTrue(
                loginPage.isLoggedOut(),
                "User not logged out successfully"
        );
    }
}