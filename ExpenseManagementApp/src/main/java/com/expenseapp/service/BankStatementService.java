package com.expenseapp.service;

import com.expenseapp.dto.StatementEntryDTO;
import com.expenseapp.dto.StatementReportDTO;
import com.expenseapp.entity.Category;
import com.expenseapp.entity.Expense;
import com.expenseapp.entity.Income;
import com.expenseapp.entity.User;
import com.expenseapp.repository.CategoryRepository;
import com.expenseapp.repository.ExpenseRepository;
import com.expenseapp.repository.IncomeRepository;
import com.expenseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankStatementService {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;

    // ── Keyword → Category mapping ───────────────────────────────────────────
    private static final Map<String, String> CATEGORY_KEYWORDS = new LinkedHashMap<>();
    static {
        CATEGORY_KEYWORDS.put("swiggy|zomato|food|restaurant|cafe|pizza|burger|hotel|eat|dining", "Food");
        CATEGORY_KEYWORDS.put("uber|ola|rapido|metro|bus|train|fuel|petrol|diesel|cab|auto|travel|flight|irctc", "Travel");
        CATEGORY_KEYWORDS.put("electricity|water|gas|broadband|internet|wifi|bill|recharge|dth|mobile|phone", "Bills");
        CATEGORY_KEYWORDS.put("amazon|flipkart|myntra|shopping|mall|store|mart|retail|purchase", "Shopping");
        CATEGORY_KEYWORDS.put("salary|payroll|stipend|wages|credit from", "Salary");
        CATEGORY_KEYWORDS.put("rent|house|flat|pg|accommodation|lease", "Rent");
        CATEGORY_KEYWORDS.put("hospital|pharmacy|medicine|doctor|clinic|health|medical", "Health");
        CATEGORY_KEYWORDS.put("netflix|spotify|prime|hotstar|subscription|ott|entertainment|movie|cinema", "Entertainment");
        CATEGORY_KEYWORDS.put("school|college|university|course|tuition|education|fees", "Education");
        CATEGORY_KEYWORDS.put("atm|cash|withdrawal", "Cash Withdrawal");
        CATEGORY_KEYWORDS.put("transfer|neft|rtgs|imps|upi|gpay|phonepe|paytm", "Transfer");
    }

    // ── Date formats ─────────────────────────────────────────────────────────
    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("MM/dd/yyyy"),
        DateTimeFormatter.ofPattern("dd MMM yyyy"),
        DateTimeFormatter.ofPattern("d MMM yyyy"),
        DateTimeFormatter.ofPattern("dd-MMM-yyyy"),
        DateTimeFormatter.ofPattern("d-MMM-yyyy"),
        DateTimeFormatter.ofPattern("d/M/yyyy"),
        DateTimeFormatter.ofPattern("d-M-yyyy"),
        DateTimeFormatter.ofPattern("dd/MM/yy"),
        DateTimeFormatter.ofPattern("dd-MM-yy")
    );

    // ── Regex to find a date anywhere in a line ───────────────────────────────
    private static final Pattern DATE_PATTERN = Pattern.compile(
        "\\b(\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4}|\\d{1,2}\\s+[A-Za-z]{3}\\s+\\d{4}|\\d{1,2}\\-[A-Za-z]{3}\\-\\d{4})\\b"
    );

    // ── Regex to find amounts (e.g. 1,234.56 or 1234.56) ────────────────────
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "(?<![\\d])([\\d,]+\\.\\d{2})(?![\\d])"
    );

    // ═════════════════════════════════════════════════════════════════════════
    // Main entry point
    // ═════════════════════════════════════════════════════════════════════════
    public StatementReportDTO parseAndSave(MultipartFile file, Long userId, boolean saveToDb, String password) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        List<StatementEntryDTO> entries;

        if (filename.endsWith(".pdf")) {
            entries = parsePdf(file, password);
        } else if (filename.endsWith(".csv")) {
            entries = parseCsv(file);
        } else {
            // Try CSV first, fall back to PDF
            try { entries = parseCsv(file); }
            catch (Exception e) { entries = parsePdf(file, password); }
        }

        if (entries.isEmpty()) {
            throw new RuntimeException("No transactions could be detected in the file.");
        }

        Map<String, Category> categoryMap = ensureCategories(user);

        BigDecimal totalExpense = BigDecimal.ZERO;
        BigDecimal totalIncome  = BigDecimal.ZERO;

        for (StatementEntryDTO entry : entries) {
            if ("expense".equals(entry.getType())) totalExpense = totalExpense.add(entry.getAmount());
            else                                    totalIncome  = totalIncome.add(entry.getAmount());

            if (saveToDb) {
                LocalDate date = parseDate(entry.getDate());
                if (date == null) date = LocalDate.now();

                if ("expense".equals(entry.getType())) {
                    if (expenseRepository.existsByUserUserIdAndAmountAndDateAndDescription(
                            user.getUserId(), entry.getAmount(), date, entry.getDescription())) {
                        continue; // skip duplicate
                    }
                    Category cat = categoryMap.getOrDefault(entry.getCategory(), categoryMap.get("Other"));
                    expenseRepository.save(Expense.builder()
                            .user(user).amount(entry.getAmount()).category(cat)
                            .date(date).description(entry.getDescription())
                            .paymentMode("Bank Transfer").build());
                } else {
                    if (incomeRepository.existsByUserUserIdAndAmountAndDateAndDescription(
                            user.getUserId(), entry.getAmount(), date, entry.getDescription())) {
                        continue; // skip duplicate
                    }
                    incomeRepository.save(Income.builder()
                            .user(user).amount(entry.getAmount())
                            .source("Salary".equals(entry.getCategory()) ? "Salary" : "Other")
                            .date(date).description(entry.getDescription()).build());
                }
            }
        }

        Map<String, BigDecimal> breakdown = entries.stream()
                .filter(e -> "expense".equals(e.getType()))
                .collect(Collectors.groupingBy(
                        StatementEntryDTO::getCategory,
                        Collectors.reducing(BigDecimal.ZERO, StatementEntryDTO::getAmount, BigDecimal::add)
                ));

        return StatementReportDTO.builder()
                .totalEntries(entries.size())
                .expenseCount((int) entries.stream().filter(e -> "expense".equals(e.getType())).count())
                .incomeCount((int)  entries.stream().filter(e -> "income".equals(e.getType())).count())
                .totalExpense(totalExpense)
                .totalIncome(totalIncome)
                .netBalance(totalIncome.subtract(totalExpense))
                .categoryBreakdown(breakdown)
                .entries(entries)
                .build();
    }

    // ═════════════════════════════════════════════════════════════════════════
    // CSV PARSER
    // ═════════════════════════════════════════════════════════════════════════
    private List<StatementEntryDTO> parseCsv(MultipartFile file) throws Exception {
        List<String[]> rows = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean foundHeader = false;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isBlank()) continue;
                String[] cols = splitCsvLine(line);
                if (!foundHeader) {
                    boolean hasDate = Arrays.stream(cols).anyMatch(c -> c.toLowerCase().contains("date"));
                    if (!hasDate) continue;
                    foundHeader = true;
                }
                rows.add(cols);
            }
        }
        if (rows.isEmpty()) throw new RuntimeException("No valid CSV data found");

        String[] header = rows.get(0);
        int dateCol   = findColumn(header, "date", "txn date", "transaction date", "value date", "posting date");
        int descCol   = findColumn(header, "description", "narration", "particulars", "remarks", "details", "transaction remarks");
        int debitCol  = findColumn(header, "debit", "withdrawal", "dr", "debit amount", "amount debited");
        int creditCol = findColumn(header, "credit", "deposit", "cr", "credit amount", "amount credited");
        int amtCol    = findColumn(header, "amount");

        if (dateCol < 0 || descCol < 0) {
            throw new RuntimeException("Could not detect Date/Description columns in CSV");
        }

        List<StatementEntryDTO> entries = new ArrayList<>();
        for (int i = 1; i < rows.size(); i++) {
            String[] row = rows.get(i);
            String rawDate = safeGet(row, dateCol);
            String desc    = safeGet(row, descCol);
            if (rawDate.isBlank() && desc.isBlank()) continue;

            LocalDate date = parseDate(rawDate);
            if (date == null) continue;

            BigDecimal debit  = parseAmount(debitCol  >= 0 ? safeGet(row, debitCol)  : "");
            BigDecimal credit = parseAmount(creditCol >= 0 ? safeGet(row, creditCol) : "");

            if (debit.compareTo(BigDecimal.ZERO) == 0 && credit.compareTo(BigDecimal.ZERO) == 0 && amtCol >= 0) {
                BigDecimal amt = parseAmount(safeGet(row, amtCol));
                if (amt.compareTo(BigDecimal.ZERO) < 0) debit = amt.abs();
                else credit = amt;
            }

            entries.add(buildEntry(date.toString(), desc, debit, credit));
        }
        return entries.stream().filter(Objects::nonNull).collect(Collectors.toList());
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PDF PARSER
    // ═════════════════════════════════════════════════════════════════════════
    private List<StatementEntryDTO> parsePdf(MultipartFile file, String password) throws Exception {
        String text;
        byte[] bytes = file.getBytes();
        PDDocument doc = null;
        try {
            RandomAccessReadBuffer buffer = new RandomAccessReadBuffer(bytes);
            if (password != null && !password.isBlank()) {
                doc = Loader.loadPDF(buffer, password.trim());
            } else {
                doc = Loader.loadPDF(buffer);
            }
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            text = stripper.getText(doc);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Could not open PDF: " + e.getMessage());
        } finally {
            if (doc != null) doc.close();
        }

        List<StatementEntryDTO> entries = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");

        // Buffer to accumulate multi-line transaction rows
        StringBuilder rowBuffer = new StringBuilder();
        // Track previous balance to determine credit/debit direction
        BigDecimal prevBalance = null;

        // First pass: collect opening balance
        for (String line : lines) {
            if (line.toLowerCase().contains("opening balance")) {
                Matcher m = AMOUNT_PATTERN.matcher(line);
                BigDecimal last = null;
                while (m.find()) last = parseAmount(m.group(1));
                if (last != null) prevBalance = last;
                break;
            }
        }

        for (String line : lines) {
            line = line.trim();
            if (line.isBlank()) continue;

            if (line.matches("(?i).*opening balance.*|.*closing balance.*|.*account summary.*"
                    + "|.*statement generated.*|.*page \\d+.*|.*end of statement.*"
                    + "|#\\s+Date\\s+Description.*|.*withdrawal.*deposit.*balance.*")) {
                rowBuffer.setLength(0);
                continue;
            }

            boolean startsNewTx = line.matches("^\\d+\\s+\\d{1,2}\\s+[A-Za-z]{3}\\s+\\d{4}.*")
                    || line.matches("^\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4}.*");

            if (startsNewTx) {
                if (rowBuffer.length() > 0) {
                    StatementEntryDTO e = parseKotakRow(rowBuffer.toString().trim(), prevBalance);
                    if (e != null) {
                        // Update prevBalance to the last amount in this row (the new balance)
                        Matcher m = AMOUNT_PATTERN.matcher(rowBuffer.toString());
                        BigDecimal last = null;
                        while (m.find()) last = parseAmount(m.group(1));
                        if (last != null) prevBalance = last;
                        entries.add(e);
                    }
                    rowBuffer.setLength(0);
                }
                rowBuffer.append(line);
            } else {
                if (rowBuffer.length() > 0) rowBuffer.append(" ").append(line);
            }
        }
        if (rowBuffer.length() > 0) {
            StatementEntryDTO e = parseKotakRow(rowBuffer.toString().trim(), prevBalance);
            if (e != null) entries.add(e);
        }

        if (entries.isEmpty()) entries = parsePdfGeneric(lines);

        return entries;
    }

    private StatementEntryDTO parseKotakRow(String row, BigDecimal prevBalance) {
        Matcher dateMatcher = DATE_PATTERN.matcher(row);
        if (!dateMatcher.find()) return null;
        String rawDate = dateMatcher.group(1);
        LocalDate date = parseDate(rawDate);
        if (date == null) return null;

        List<BigDecimal> amounts = new ArrayList<>();
        List<Integer> amtPositions = new ArrayList<>();
        Matcher amtMatcher = AMOUNT_PATTERN.matcher(row);
        while (amtMatcher.find()) {
            amounts.add(parseAmount(amtMatcher.group(1)));
            amtPositions.add(amtMatcher.start());
        }
        if (amounts.isEmpty()) return null;

        // Description: text after date, before first amount
        int dateEnd = dateMatcher.end();
        int firstAmtStart = amtPositions.get(0);
        String desc = row.substring(dateEnd, firstAmtStart).trim();
        desc = desc.replaceAll("^\\d+\\s+", "").trim();
        desc = desc.replaceAll("\\b\\d{12,}\\b", "").trim();
        desc = desc.replaceAll("\\s{2,}", " ").trim();
        if (desc.isBlank()) desc = "Bank Transaction";

        BigDecimal debit = BigDecimal.ZERO;
        BigDecimal credit = BigDecimal.ZERO;

        // Last amount is always the running balance
        BigDecimal currentBalance = amounts.get(amounts.size() - 1);
        BigDecimal txAmt = amounts.size() >= 2 ? amounts.get(amounts.size() - 2) : amounts.get(0);

        if (prevBalance != null) {
            // Most reliable: compare current balance with previous balance
            BigDecimal delta = currentBalance.subtract(prevBalance);
            if (delta.compareTo(BigDecimal.ZERO) > 0) {
                credit = txAmt; // balance went UP → money came IN
            } else {
                debit = txAmt;  // balance went DOWN → money went OUT
            }
        } else {
            // No previous balance — fall back to keywords
            String rowLower = row.toLowerCase();
            boolean isCreditKeyword = rowLower.contains("salary") || rowLower.contains("credit")
                    || rowLower.contains("deposit") || rowLower.contains("received")
                    || rowLower.contains("refund") || rowLower.contains("cashback");
            if (isCreditKeyword) credit = txAmt;
            else debit = txAmt;
        }

        return buildEntry(date.toString(), desc, debit, credit);
    }

    /** Generic fallback PDF parser for non-Kotak formats */
    private List<StatementEntryDTO> parsePdfGeneric(String[] lines) {
        List<StatementEntryDTO> entries = new ArrayList<>();
        for (String line : lines) {
            line = line.trim();
            if (line.isBlank()) continue;
            Matcher dateMatcher = DATE_PATTERN.matcher(line);
            if (!dateMatcher.find()) continue;
            String rawDate = dateMatcher.group(1);
            LocalDate date = parseDate(rawDate);
            if (date == null) continue;
            List<BigDecimal> amounts = new ArrayList<>();
            Matcher amtMatcher = AMOUNT_PATTERN.matcher(line);
            String lastAmt = "";
            while (amtMatcher.find()) {
                amounts.add(parseAmount(amtMatcher.group(1)));
                lastAmt = amtMatcher.group(1);
            }
            if (amounts.isEmpty()) continue;
            String desc = extractDescription(line, rawDate, lastAmt);
            if (desc.isBlank()) desc = line.substring(0, Math.min(60, line.length()));
            String lineLower = line.toLowerCase();
            BigDecimal debit = BigDecimal.ZERO, credit = BigDecimal.ZERO;
            boolean hasCr = lineLower.contains(" cr") || lineLower.contains("credit") || lineLower.contains("deposit");
            BigDecimal amt = amounts.get(0);
            if (hasCr) credit = amt; else debit = amt;
            StatementEntryDTO entry = buildEntry(date.toString(), desc.trim(), debit, credit);
            if (entry != null) entries.add(entry);
        }
        return entries;
    }

    private String extractDescription(String line, String date, String firstAmount) {
        // Remove date from start
        String desc = line.replaceFirst(Pattern.quote(date), "").trim();
        // Remove amount and everything after
        int amtIdx = desc.indexOf(firstAmount.replace(",", ""));
        if (amtIdx < 0) amtIdx = desc.indexOf(firstAmount);
        if (amtIdx > 0) desc = desc.substring(0, amtIdx).trim();
        // Clean up extra spaces and special chars
        return desc.replaceAll("\\s{2,}", " ").replaceAll("[|/\\\\]+", " ").trim();
    }

    // ═════════════════════════════════════════════════════════════════════════
    // SHARED HELPERS
    // ═════════════════════════════════════════════════════════════════════════
    private StatementEntryDTO buildEntry(String date, String desc, BigDecimal debit, BigDecimal credit) {
        String type;
        BigDecimal amount;

        if (credit.compareTo(BigDecimal.ZERO) > 0 && debit.compareTo(BigDecimal.ZERO) == 0) {
            type = "income"; amount = credit;
        } else if (debit.compareTo(BigDecimal.ZERO) > 0) {
            type = "expense"; amount = debit;
        } else {
            return null;
        }

        return StatementEntryDTO.builder()
                .date(date)
                .description(desc)
                .amount(amount)
                .type(type)
                .category(detectCategory(desc))
                .paymentMode("Bank Transfer")
                .build();
    }

    private String[] splitCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { tokens.add(sb.toString().trim()); sb.setLength(0); }
            else { sb.append(c); }
        }
        tokens.add(sb.toString().trim());
        return tokens.toArray(new String[0]);
    }

    private int findColumn(String[] header, String... keywords) {
        for (int i = 0; i < header.length; i++) {
            String h = header[i].toLowerCase().trim().replaceAll("[^a-z0-9 ]", "");
            for (String kw : keywords) {
                if (h.equals(kw) || h.contains(kw)) return i;
            }
        }
        return -1;
    }

    private LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) return null;
        raw = raw.trim().replaceAll("\"", "");
        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try { return LocalDate.parse(raw, fmt); } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private BigDecimal parseAmount(String raw) {
        if (raw == null || raw.isBlank()) return BigDecimal.ZERO;
        try {
            String cleaned = raw.replaceAll("[^0-9.\\-]", "");
            if (cleaned.isBlank() || cleaned.equals(".")) return BigDecimal.ZERO;
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private String detectCategory(String description) {
        if (description == null) return "Other";
        String lower = description.toLowerCase();
        for (Map.Entry<String, String> entry : CATEGORY_KEYWORDS.entrySet()) {
            for (String kw : entry.getKey().split("\\|")) {
                if (lower.contains(kw)) return entry.getValue();
            }
        }
        return "Other";
    }

    private Map<String, Category> ensureCategories(User user) {
        List<String> defaults = List.of(
            "Food","Travel","Bills","Shopping","Salary","Rent",
            "Health","Entertainment","Education","Cash Withdrawal","Transfer","Other"
        );
        Map<String, Category> map = new HashMap<>();
        categoryRepository.findByUserUserId(user.getUserId()).forEach(c -> map.put(c.getName(), c));
        for (String name : defaults) {
            if (!map.containsKey(name)) {
                map.put(name, categoryRepository.save(
                    Category.builder().name(name).user(user).build()));
            }
        }
        return map;
    }

    private String safeGet(String[] arr, int idx) {
        return (idx >= 0 && idx < arr.length) ? arr[idx].replaceAll("\"", "").trim() : "";
    }

    // ═════════════════════════════════════════════════════════════════════════
    // REMOVE ALL STATEMENT DATA
    // ═════════════════════════════════════════════════════════════════════════
    public Map<String, Integer> removeAllStatementData(Long userId) {
        List<com.expenseapp.entity.Expense> stmtExpenses = expenseRepository.findByUserUserId(userId)
                .stream()
                .filter(e -> "Bank Transfer".equals(e.getPaymentMode()))
                .collect(Collectors.toList());
        stmtExpenses.forEach(e -> expenseRepository.deleteById(e.getExpenseId()));

        List<com.expenseapp.entity.Income> stmtIncome = incomeRepository.findByUserUserId(userId)
                .stream()
                .filter(i -> i.getDescription() != null && (
                        i.getDescription().toUpperCase().contains("UPI") ||
                        i.getDescription().toUpperCase().contains("NEFT") ||
                        i.getDescription().toUpperCase().contains("NACH") ||
                        i.getDescription().toUpperCase().contains("IMPS")))
                .collect(Collectors.toList());
        stmtIncome.forEach(i -> incomeRepository.deleteById(i.getIncomeId()));

        return Map.of("expensesRemoved", stmtExpenses.size(), "incomeRemoved", stmtIncome.size());
    }

    // ═════════════════════════════════════════════════════════════════════════
    // REMOVE DUPLICATES from existing DB records
    // ═════════════════════════════════════════════════════════════════════════
    public Map<String, Integer> removeDuplicates(Long userId) {
        int expensesRemoved = 0;
        int incomeRemoved = 0;
        List<com.expenseapp.entity.Expense> expenses = expenseRepository.findByUserUserId(userId);
        Map<String, Long> seenExpenses = new java.util.LinkedHashMap<>();
        for (com.expenseapp.entity.Expense e : expenses) {
            String key = e.getAmount() + "|" + e.getDate() + "|" + e.getDescription();
            if (seenExpenses.containsKey(key)) {
                expenseRepository.deleteById(e.getExpenseId());
                expensesRemoved++;
            } else {
                seenExpenses.put(key, e.getExpenseId());
            }
        }
        List<com.expenseapp.entity.Income> incomes = incomeRepository.findByUserUserId(userId);
        Map<String, Long> seenIncome = new java.util.LinkedHashMap<>();
        for (com.expenseapp.entity.Income i : incomes) {
            String key = i.getAmount() + "|" + i.getDate() + "|" + i.getDescription();
            if (seenIncome.containsKey(key)) {
                incomeRepository.deleteById(i.getIncomeId());
                incomeRemoved++;
            } else {
                seenIncome.put(key, i.getIncomeId());
            }
        }
        return Map.of("expensesRemoved", expensesRemoved, "incomeRemoved", incomeRemoved);
    }
}
