<template>
<div class="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-4 flex flex-col justify-center items-center w-full max-w-[100%] mx-auto min-h-[100vh] box-border">
  <h1  v-if="!isLoading" class="text-2xl font-bold mb-5 mt-1 text-center">Clean Code Principles</h1>

  <div class="w-full max-w-4xl relative">
      <transition name="fade" mode="out-in">
        <div v-if="isLoading" class="absolute inset-0 bg-gray-800 bg-opacity-75 rounded-xl flex items-center justify-center">
          <Spinner />
        </div>

        <div v-else key="card.id" class="bg-white text-gray-800 rounded-xl shadow-1xl overflow-hidden">
          <div class="p-6">
            <div class="flex items-center">
              <span class="text-2xl font-bold">{{ card.title }}</span>
            </div>
            <p class="text-xl">{{ card.content }}</p>

            <!-- Code to Avoid Block with Highlighting -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold mb-2">Code to Avoid</h3>

              <!-- v-html is used here to inject the raw HTML code -->
                <div class="bg-red-100 p-4 rounded-md overflow-x-auto text-sm" v-html="renderMarkdown(card.codeToAvoid)"></div>
            </div>

            <!-- Preferred Code Block with Highlighting -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold mb-2">Preferred Code</h3>
                <div class="bg-green-100 p-4 rounded-md overflow-x-auto text-sm" v-html="renderMarkdown(card.codeToPrefer)"></div>
            </div>

            <!-- Benefits Section -->
            <div>
              <h3 class="text-xl font-semibold mb-2">Benefits:</h3>
              <ul class="list-disc list-inside">
                <li v-for="(benefit, index) in card.benefits" :key="index" class="text-lg">{{ benefit }}</li>
              </ul>
            </div>
          </div>
        </div>
      </transition>

      <!-- Navigation Buttons -->
      <button
        @click="prevCard"
        class="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
        :disabled="isLoading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      <button
        @click="nextCard"
        class="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
        :disabled="isLoading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>

    <!-- Dots Navigation -->
    <div class="mt-8 flex space-x-2">
      <button
        v-for="(_, index) in cleanCodeCards"
        :key="index"
        @click="setCurrentIndex(index)"
        class="w-3 h-3 rounded-full"
        :class="index === currentIndex ? 'bg-blue-500' : 'bg-gray-400'"
        :disabled="isLoading"
        v-if="!isLoading"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import Spinner from './Spinner.vue';
import MarkdownIt from 'markdown-it';

// Initialize markdown-it
const md = new MarkdownIt();

// Define the Markdown content as a string
const markdownContent = `
\`\`\`java
class UserDetails {
    String name;
    String email;
    int age;
    String address;
  }
  
  createUser(UserDetails details)
\`\`\`
`;
// Parse the markdown content to HTML
const renderedMarkdown = md.render(markdownContent);

const cleanCodeCards = [
  {
    id: 1,
    title: "Organize Related Arguments",
    content: "If a group of arguments seem absolutely necessary in a method, organizing them into their own class will help as long as they are related and cohesive.",
    codeToAvoid: `
\`\`\`java
createUser(String name, String email, int age, String address)
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java{1,3,5}
class UserDetails {
  String name;
  String email;
  int age;
  String address;
}

createUser(UserDetails details)
\`\`\`
    `,
    benefits: [
      "Improves code readability",
      "Reduces method complexity",
      "Makes it easier to add or remove fields in the future"
    ]
  },
  {
    id: 2,
    title: "Remove Side Effects",
    content: "Remove side effects and make sure a method does only what it advertises via its method name.",
    codeToAvoid: `
\`\`\`java
function checkPassword(String password) {
  if (password.equals(storedPassword)) {
    Session.initialize();  // Side effect!
    return true;
  }
  return false;
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
function checkPassword(String password) {
  return password.equals(storedPassword);
}

function login(String password) {
  if (checkPassword(password)) {
    Session.initialize();
    return true;
  }
  return false;
}
\`\`\`
    `,
    benefits: [
      "Improves predictability of method behavior",
      "Enhances testability",
      "Reduces unexpected bugs"
    ]
  },
  {
    id: 3,
    title: "Function Purpose",
    content: "Functions should either change the state of an object or return some info about the object, but not both.",
    codeToAvoid: `
\`\`\`java
function adjustVolumeAndReturnState(int adjustment) {
  this.volume += adjustment;
  if (this.volume > MAX_VOLUME) {
    this.volume = MAX_VOLUME;
  }
  return this.isOn && this.volume > 0;
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
function adjustVolume(int adjustment) {
  this.volume = Math.min(this.volume + adjustment, MAX_VOLUME);
}

function isPlaying() {
  return this.isOn && this.volume > 0;
}
\`\`\`
    `,
    benefits: [
      "Improves function clarity and predictability",
      "Adheres to the Single Responsibility Principle",
      "Enhances testability and maintainability"
    ]
  },
  {
    id: 4,
    title: "Use Exceptions Over Error Codes",
    content: "Prefer to use exceptions over error codes for better error handling and cleaner code.",
    codeToAvoid: `
\`\`\`java
int withdrawMoney(double amount) {
  if (amount > balance) {
    return -1;  // Error code for insufficient funds
  }
  balance -= amount;
  return 0;  // Success code
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
void withdrawMoney(double amount) throws InsufficientFundsException {
  if (amount > balance) {
    throw new InsufficientFundsException("Not enough balance");
  }
  balance -= amount;
}
\`\`\`
    `,
    benefits: [
      "Clearer error handling",
      "Separates normal flow from error handling",
      "Provides more detailed error information"
    ]
  },
  {
    id: 5,
    title: "Well-Defined Interfaces",
    content: "Always expose interfaces with well-defined methods and operations. Method names should be abstract and not expose the inner workings/implementation.",
    codeToAvoid: `
\`\`\`java
interface DataStorage {
  void saveToMySQLDatabase(Data data);
  Data loadFromMySQLDatabase(int id);
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
interface DataStorage {
  void save(Data data);
  Data load(int id);
}
\`\`\`
    `,
    benefits: [
      "Improves code flexibility and maintainability",
      "Allows for easier implementation changes",
      "Enhances code readability"
    ]
  },
  {
    id: 6,
    title: "Avoid Chain of Calls",
    content: "Avoid chain of calls such as class.method().method2().get(); (instead split into assignments).",
    codeToAvoid: `
\`\`\`java
int result = obj.getX().getY().calculate().getValue();
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
X x = obj.getX();
Y y = x.getY();
Calculator calc = y.calculate();
int result = calc.getValue();
\`\`\`
    `,
    benefits: [
      "Improves code readability",
      "Makes debugging easier",
      "Allows for better error handling"
    ]
  },
  {
    id: 7,
    title: "Law of Demeter",
    content: "A method of an object should invoke only the methods of the following kinds of objects: itself, its parameters, any objects it creates, and its direct component objects.",
    codeToAvoid: `
\`\`\`java
class Customer {
  Wallet wallet;

  void purchaseItem(Item item) {
    Money money = wallet.getMoney();
    if (money.getAmount() >= item.getPrice()) {
      // Make purchase
    }
  }
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
class Customer {
  Wallet wallet;

  void purchaseItem(Item item) {
    if (wallet.hasSufficientFunds(item.getPrice())) {
      wallet.deduct(item.getPrice());
      // Complete purchase
    }
  }
}
\`\`\`
    `,
    benefits: [
      "Reduces coupling between classes",
      "Improves maintainability",
      "Makes code more modular and easier to change"
    ]
  },
  {
    id: 8,
    title: "Single Responsibility Principle",
    content: "A class should have only one reason to change, meaning it should have only one job or responsibility.",
    codeToAvoid: `
\`\`\`java
class UserManager {
  void createUser(User user) { /* ... */ }
  void updateUser(User user) { /* ... */ }
  void deleteUser(User user) { /* ... */ }
  void sendEmail(User user, String message) { /* ... */ }
  void generateReport() { /* ... */ }
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
class UserManager {
  void createUser(User user) { /* ... */ }
  void updateUser(User user) { /* ... */ }
  void deleteUser(User user) { /* ... */ }
}

class EmailService {
  void sendEmail(User user, String message) { /* ... */ }
}

class ReportGenerator {
  void generateReport() { /* ... */ }
}
\`\`\`
    `,
    benefits: [
      "Increases code modularity",
      "Simplifies testing and maintenance",
      "Improves code organization and readability"
    ]
  },
  {
    id: 9,
    title: "Avoid Magic Numbers",
    content: "Replace hard-coded numbers with named constants to improve code readability and maintainability.",
    codeToAvoid: `
\`\`\`java
if (employee.daysWorked > 260) {
  // Calculate bonus
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
const WORKING_DAYS_PER_YEAR = 260;

if (employee.daysWorked > WORKING_DAYS_PER_YEAR) {
  // Calculate bonus
}
\`\`\`
    `,
    benefits: [
      "Improves code readability",
      "Makes code more maintainable",
      "Reduces the likelihood of errors due to magic numbers"
    ]
  },
  {
    id: 10,
    title: "Use Meaningful Names",
    content: "Choose names that reveal intent. Names should be specific, meaningful, and pronounceable.",
    codeToAvoid: `
\`\`\`java
int d; // elapsed time in days
List<int> lst; // list of user IDs
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
int elapsedTimeInDays;
List<int> userIds;
\`\`\`
    `,
    benefits: [
      "Improves code readability",
      "Reduces the need for comments",
      "Makes code self-documenting"
    ]
  }
  ,
  {
    id: 11,
    title: "Avoid Boolean Parameters",
    content: "Boolean parameters complicate the readability of a method. They obscure the method’s purpose and can lead to confusing logic.",
    codeToAvoid: `
\`\`\`java
void schedule(boolean isUrgent) {
  if (isUrgent) {
    // Do urgent scheduling
  } else {
    // Do normal scheduling
  }
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
void scheduleUrgently() {
  // Do urgent scheduling
}

void scheduleNormally() {
  // Do normal scheduling
}
\`\`\`
    `,
    benefits: [
      "Improves readability by eliminating ambiguous flags",
      "Clarifies method intentions",
      "Avoids conditional complexity"
    ]
  },
  {
    id: 12,
    title: "DRY (Don't Repeat Yourself)",
    content: "Avoid duplicating code. Repeated logic should be abstracted into reusable functions or classes.",
    codeToAvoid: `
\`\`\`java
void createUser(String name, String email) {
  if (name == null || email == null) {
    throw new IllegalArgumentException("Invalid input");
  }
  // Create user logic
}

void updateUser(String name, String email) {
  if (name == null || email == null) {
    throw new IllegalArgumentException("Invalid input");
  }
  // Update user logic
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
void validateInput(String name, String email) {
  if (name == null || email == null) {
    throw new IllegalArgumentException("Invalid input");
  }
}

void createUser(String name, String email) {
  validateInput(name, email);
  // Create user logic
}

void updateUser(String name, String email) {
  validateInput(name, email);
  // Update user logic
}
\`\`\`
    `,
    benefits: [
      "Reduces code duplication",
      "Increases maintainability",
      "Reduces bugs"
    ]
  },
  {
    id: 13,
    title: "Fail Fast",
    content: "The sooner a system can detect and handle errors, the more robust it will be.",
    codeToAvoid: `
\`\`\`java
void processTransaction(String accountId, double amount) {
  // Process transaction logic
  if (accountId == null) {
    // Handle null account later
  }
  // More processing
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
void processTransaction(String accountId, double amount) {
  if (accountId == null) {
    throw new IllegalArgumentException("Account ID cannot be null");
  }
  // Process transaction logic
}
\`\`\`
    `,
    benefits: [
      "Prevents unexpected errors",
      "Improves reliability",
      "Makes debugging easier"
    ]
  },
  {
    id: 14,
    title: "Encapsulate Conditionals",
    content: "Instead of writing complex conditionals, extract them into methods with meaningful names.",
    codeToAvoid: `
\`\`\`java
if (age > 18 && hasValidId && !isRestricted) {
  // Grant access
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
if (isEligibleForAccess(age, hasValidId, isRestricted)) {
  // Grant access
}

boolean isEligibleForAccess(int age, boolean hasValidId, boolean isRestricted) {
  return age > 18 && hasValidId && !isRestricted;
}
\`\`\`
    `,
    benefits: [
      "Improves readability",
      "Clarifies logic",
      "Easier to change in the future"
    ]
  },
  {
    id: 15,
    title: "Comment Only Where Necessary",
    content: "Comments should explain why code exists, not what it does. The code itself should be clear enough.",
    codeToAvoid: `
\`\`\`java
// This function calculates the total price including tax
double calculatePrice(double price, double taxRate) {
  return price + (price * taxRate);
}
\`\`\`
    `,
    codeToPrefer: `
\`\`\`java
double calculateTotalPriceWithTax(double price, double taxRate) {
  return price + (price * taxRate);
}
\`\`\`
    `,
    benefits: [
      "Reduces unnecessary comments",
      "Increases code self-documentation",
      "Makes code cleaner"
    ]
  }
];
const currentIndex = ref(0);
const isLoading = ref(false);

// Navigation logic to move between cards
const nextCard = () => {
  isLoading.value = true;
  setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % cleanCodeCards.length;
    isLoading.value = false;
    highlightCode(); // Re-apply syntax highlighting after navigation
  }, 500);
};

const prevCard = () => {
  isLoading.value = true;
  setTimeout(() => {
    currentIndex.value = (currentIndex.value - 1 + cleanCodeCards.length) % cleanCodeCards.length;
    isLoading.value = false;
    highlightCode(); // Re-apply syntax highlighting after navigation
  }, 500);
};

const setCurrentIndex = (index) => {
  isLoading.value = true;
  setTimeout(() => {
    currentIndex.value = index;
    isLoading.value = false;
    highlightCode(); // Re-apply syntax highlighting when manually changing cards
  }, 500);
};

const card = computed(() => cleanCodeCards[currentIndex.value]);

// Function to highlight code blocks using highlight.js
const highlightCode = () => {
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach((block) => {
    // hljs.highlightElement(block); // Highlight each code block
  });
};

// Apply syntax highlighting when the component is mounted
onMounted(() => {
  highlightCode();
});

// Watch for changes in currentIndex and re-apply highlighting
watch(currentIndex, () => {
  highlightCode();
});

// Function to render Markdown
const renderMarkdown = (markdownContent) => {
  return md.render(markdownContent); // Convert markdown to HTML
};
</script>
