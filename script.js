    /* =====================================================
    IQBAL SWEET HOUSE
    COMPLETE WEBSITE SCRIPT
    ===================================================== */


    /* =====================================================
    CART STORAGE
    ===================================================== */

    let cart =
        JSON.parse(localStorage.getItem("iqbalCart")) || [];


    function saveCart() {

        localStorage.setItem(
            "iqbalCart",
            JSON.stringify(cart)
        );

    }


    /* =====================================================
    ORDER STORAGE
    ===================================================== */

    let currentOrder =
        JSON.parse(localStorage.getItem("iqbalOrder")) || null;


    /* =====================================================
    HERO SLIDER
    ===================================================== */

    let currentSlide = 0;

    const slides =
        document.querySelectorAll(".hero-slide");

    const dots =
        document.querySelectorAll(".dot");


    function showSlide(index) {

        if (slides.length === 0) {
            return;
        }


        if (index >= slides.length) {

            currentSlide = 0;

        }

        else if (index < 0) {

            currentSlide =
                slides.length - 1;

        }

        else {

            currentSlide = index;

        }


        slides.forEach((slide) => {

            slide.classList.remove("active");

        });


        dots.forEach((dot) => {

            dot.classList.remove("active");

        });


        slides[currentSlide].classList.add("active");


        if (dots[currentSlide]) {

            dots[currentSlide].classList.add("active");

        }

    }


    function nextSlide() {

        showSlide(currentSlide + 1);

    }


    function previousSlide() {

        showSlide(currentSlide - 1);

    }


    if (slides.length > 0) {

        showSlide(0);


        setInterval(() => {

            nextSlide();

        }, 5000);

    }


    /* =====================================================
    CART COUNT
    ===================================================== */

    function updateCartCount() {

        const cartCount =
            document.querySelector(".cart-count");


        if (!cartCount) {

            return;

        }


        let totalQuantity = 0;


        cart.forEach((item) => {

            totalQuantity += item.quantity;

        });


        cartCount.textContent =
            totalQuantity;

    }


    /* =====================================================
    PRODUCT MODAL
    ===================================================== */

    let selectedProduct = null;

    let modalQuantity = 1;
    let selectedWeight = 1;

    function selectWeight(weight, button) {
        if (!selectedProduct) {
            return;
        }

        selectedWeight = weight;

        // Remove active from all weight buttons
        document.querySelectorAll(".weight-option").forEach(btn => {
            btn.classList.remove("active");
        });

        // Make selected button active
        if (button) {
            button.classList.add("active");
        }

        updateModalPrice();
    }

    function updateModalPrice() {
        if (!selectedProduct) {
            return;
        }

        let totalPrice;

        // RUSK SPECIAL PRICES
        if (
            selectedProduct.name === "Gol Special Rusk" ||
            selectedProduct.name === "Cut Rusk" ||
            selectedProduct.name === "Burger Special Rusk"
        ) {
            if (selectedWeight === 0.25) {
                totalPrice = 180 * modalQuantity;
            } else if (selectedWeight === 0.5) {
                totalPrice = 350 * modalQuantity;
            } else {
                totalPrice = selectedProduct.price * selectedWeight * modalQuantity;
            }
        } else {
            // Other products
            totalPrice =
                selectedProduct.price *
                selectedWeight *
                modalQuantity;
        }

        const priceElement =
            document.getElementById("modal-product-price");

        if (priceElement) {
            priceElement.textContent =
                "Rs. " + totalPrice.toLocaleString();
        }
    }

    function openProductModal(
        name,
        price,
        image,
        description
    ) {

        const modal =
            document.getElementById(
                "product-modal"
            );


        if (!modal) {

            return;

        }


        selectedProduct = {

            name: name,

            price: price,

            image: image,

            description: description

        };


        modalQuantity = 1;
        selectedWeight = 1;


        const nameElement =
            document.getElementById(
                "modal-product-name"
            );


        const descriptionElement =
            document.getElementById(
                "modal-product-description"
            );


        const priceElement =
            document.getElementById(
                "modal-product-price"
            );


        const imageElement =
            document.getElementById(
                "modal-product-image"
            );


        const quantityElement =
            document.getElementById(
                "modal-quantity"
            );


        if (nameElement) {

            nameElement.textContent =
                name;

        }


        if (descriptionElement) {

            descriptionElement.textContent =
                description;

        }


        if (priceElement) {

            priceElement.textContent =
                "Rs. " +
                price.toLocaleString();

        }


        if (imageElement) {

            imageElement.src =
                image;

            imageElement.alt =
                name;

        }


        if (quantityElement) {

            quantityElement.textContent =
                modalQuantity;

        }
    const oneKgButton = document.querySelector(
        '.weight-option[onclick="selectWeight(1, this)"]'
    );

    if (oneKgButton) {
        const isRusk =
            name === "Gol Special Rusk" ||
            name === "Cut Rusk" ||
            name === "Burger Special Rusk";

        oneKgButton.style.display = isRusk ? "none" : "";
    }

        modal.classList.add("show");

    }


    function closeProductModal() {

        const modal =
            document.getElementById(
                "product-modal"
            );


        if (modal) {

            modal.classList.remove("show");

        }


        selectedProduct = null;

    }


    function changeModalQuantity(change) {

        if (!selectedProduct) {

            return;

        }


        modalQuantity += change;


        if (modalQuantity < 1) {

            modalQuantity = 1;

        }


        const quantityElement =
            document.getElementById(
                "modal-quantity"
            );


        if (quantityElement) {

            quantityElement.textContent =
                modalQuantity;

        }


        const totalPrice =
        selectedProduct.price *
        selectedWeight *
        modalQuantity;


        const priceElement =
            document.getElementById(
                "modal-product-price"
            );


        if (priceElement) {

            priceElement.textContent =
                "Rs. " +
                totalPrice.toLocaleString();

        }

    }


    /* =====================================================
    ADD FROM PRODUCT MODAL
    ===================================================== */

    function addModalProductToCart() {

        if (!selectedProduct) {

            return;

        }


    const existingProduct = cart.find(
        item =>
            item.name === selectedProduct.name &&
            item.weight === selectedWeight
    );


        if (existingProduct) {

            existingProduct.quantity +=
                modalQuantity;

        }

        else {

            cart.push({

                name:
                    selectedProduct.name,

            price: (
        selectedProduct.name === "Gol Special Rusk" ||
        selectedProduct.name === "Cut Rusk" ||
        selectedProduct.name === "Burger Special Rusk"
    )
        ? (selectedWeight === 0.25 ? 180 : 350)
        : selectedProduct.price * selectedWeight,   
                quantity:
                    modalQuantity,

            weight: selectedWeight,

                image:
                    selectedProduct.image

            });

        }

saveCart();

updateCartCount();

const trackedItem = cart.find(
    item =>
        item.name === selectedProduct.name &&
        item.weight === selectedWeight
);

if (trackedItem) {
    trackAddToCart(
        trackedItem.name,
        trackedItem.price,
        modalQuantity,
        selectedWeight
    );
}

closeProductModal();

showCartAddedMessage();

    }
/* =====================================================
   GOOGLE ANALYTICS - ADD TO CART
   ===================================================== */

function trackAddToCart(name, price, quantity = 1, weight = 1) {

    if (typeof gtag !== "function") {
        return;
    }

    gtag("event", "add_to_cart", {
        currency: "PKR",
        value: Number(price) * Number(quantity),

        items: [
            {
                item_name: name,
                price: Number(price),
                quantity: Number(quantity),
                item_variant: weight + " KG"
            }
        ]
    });
}

    /* =====================================================
    DIRECT ADD TO CART
    ===================================================== */
    function addToCart(
        name,
        price,
        image = "",
        weight = 1
    ) {

        const existingProduct = cart.find(
            item =>
                item.name === name &&
                item.weight === weight
        );

        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            cart.push({
                name: name,
                price: price,
                quantity: 1,
                weight: weight,
                image: image
            });
        }
        saveCart();
        updateCartCount();
        showCartAddedMessage();
    }


    /* =====================================================
    CART SUCCESS MESSAGE
    ===================================================== */

    function showCartAddedMessage() {

        /* =========================
        GREEN SUCCESS POPUP
        ========================= */

        const toast = document.getElementById("cart-toast");


        if (toast) {

            /* Force popup to front */

            toast.style.display = "flex";
            toast.style.position = "fixed";

            toast.style.left = "50%";
            toast.style.bottom = "90px";

            toast.style.transform =
                "translateX(-50%)";

            toast.style.background =
                "#18a83b";

            toast.style.color =
                "#ffffff";

            toast.style.padding =
                "12px 24px";

            toast.style.borderRadius =
                "25px";

            toast.style.fontSize =
                "17px";

            toast.style.fontWeight =
                "bold";

            toast.style.lineHeight =
                "1.2";

            toast.style.whiteSpace =
                "nowrap";

            toast.style.zIndex =
                "999999";

            toast.style.visibility =
                "visible";

            toast.style.opacity =
                "1";

            toast.style.pointerEvents =
                "none";


            /* Restart timer every time */

            clearTimeout(
                window.cartToastTimer
            );


            window.cartToastTimer =
                setTimeout(() => {

                    toast.style.opacity = "0";

                    toast.style.visibility = "hidden";

                    toast.style.display = "none";

                }, 3000);

        }


        /* =========================
        VIEW CART BAR
        ========================= */

        const cartBar =
            document.getElementById("view-cart-bar");

        const cartTotal =
            document.getElementById("view-cart-total");


        let total = 0;


        cart.forEach((item) => {

            total +=
                Number(item.price) *
                Number(item.quantity);

        });


        if (cartTotal) {

            cartTotal.textContent =
                "Rs. " +
                total.toLocaleString();

        }


        if (cartBar) {

            cartBar.style.display =
                "flex";

            cartBar.style.position =
                "fixed";

            cartBar.style.zIndex =
                "999998";

        }

    }

    /* =====================================================
    CART PAGE
    ===================================================== */

    function renderCartPage() {

        const cartItems =
            document.getElementById(
                "cart-items"
            );


        if (!cartItems) {

            return;

        }


        const totalElement =
            document.getElementById(
                "cart-page-total"
            );


        const proceedButton =
            document.getElementById(
                "proceed-order-btn"
            );


        if (cart.length === 0) {

            cartItems.innerHTML = `

                <div class="empty-cart">

                    <div class="empty-cart-icon">
                        🛒
                    </div>

                    <h2>
                        Your cart is empty
                    </h2>

                    <p>
                        Add some delicious sweets
                        to your cart.
                    </p>

                    <a
                        href="index.html#sweets"
                        class="continue-shopping-btn">

                        Continue Shopping

                    </a>

                </div>

            `;


            if (totalElement) {

                totalElement.textContent =
                    "Rs. 0";

            }


            if (proceedButton) {

                proceedButton.disabled =
                    true;

                proceedButton.style.opacity =
                    "0.5";

                proceedButton.style.cursor =
                    "not-allowed";

            }


            return;

        }


        cartItems.innerHTML = "";


        let total = 0;


        cart.forEach((item, index) => {

            const itemTotal =
                item.price *
                item.quantity;


            total += itemTotal;


            const cartItem =
                document.createElement(
                    "div"
                );


            cartItem.className =
                "cart-item";


            cartItem.innerHTML = `  

                <div class="cart-product">

                    <strong>
                        ${item.name}
                    </strong>

            ${
        item.name.includes(" Pound")
            ? ""
            : item.name.startsWith("Milky Bread") ||
            item.name.startsWith("Plain Bread") ||
            item.name === "Brown Bread" ||
            item.name === "Band" ||
            item.name === "Sheermal"
                ? ""
                : item.weight === 0.25
                    ? ` / ${item.weight * item.quantity * 1000} Gram`
                    : item.weight === 0.5
                        ? ` / ${item.weight * item.quantity} KG`
                        : ` / ${item.weight * item.quantity} KG`
    }
                </div>


                <div class="cart-controls">

                    <button
                        type="button"
                        onclick="decreaseQuantity(${index})">

                        −

                    </button>


                    <span>
                        ${item.quantity}
                    </span>


                    <button
                        type="button"
                        onclick="increaseQuantity(${index})">

                        +

                    </button>


                    <button
                        type="button"
                        class="remove-btn"
                        onclick="removeFromCart(${index})">

                        Remove

                    </button>

                </div>


                <strong class="cart-item-total">

                    Rs.
                    ${itemTotal.toLocaleString()}

                </strong>

            `;


            cartItems.appendChild(
                cartItem
            );

        });


        if (totalElement) {

            totalElement.textContent =
                "Rs. " +
                total.toLocaleString();

        }


        if (proceedButton) {

            proceedButton.disabled =
                false;

            proceedButton.style.opacity =
                "1";

            proceedButton.style.cursor =
                "pointer";

        }

    }


    /* =====================================================
    CART QUANTITY
    ===================================================== */

    function increaseQuantity(index) {

        if (!cart[index]) {

            return;

        }


        cart[index].quantity++;


        saveCart();

        updateCartCount();

        renderCartPage();

    }


    function decreaseQuantity(index) {

        if (!cart[index]) {

            return;

        }


        if (
            cart[index].quantity >
            1
        ) {

            cart[index].quantity--;

        }

        else {

            cart.splice(index, 1);

        }


        saveCart();

        updateCartCount();

        renderCartPage();

    }


    function removeFromCart(index) {

        if (!cart[index]) {

            return;

        }


        cart.splice(index, 1);


        saveCart();

        updateCartCount();

        renderCartPage();

    }


    /* =====================================================
    OPEN CHECKOUT
    ===================================================== */

   function proceedToCheckout() {

    if (cart.length === 0) {
        return;
    }

    saveCart();

    if (typeof gtag === "function") {
        gtag("event", "begin_checkout", {
            currency: "PKR",
            value: cart.reduce(
                (total, item) =>
                    total + (item.price * item.quantity),
                0
            ),
            items: cart.map(item => ({
                item_name: item.name,
                price: Number(item.price),
                quantity: Number(item.quantity)
            }))
        });
    }

    window.location.href =
        "checkout.html";
}


    function checkout() {

        proceedToCheckout();

    }


    /* =====================================================
    CHECKOUT SUMMARY
    ===================================================== */

    function renderCheckout() {

        const summary = document.getElementById("checkout-summary");
        const totalElement = document.getElementById("checkout-total");

        if (!summary || !totalElement) {
            return;
        }

        summary.innerHTML = "";

        let total = 0;

        cart.forEach((item) => {

            const itemTotal = Number(item.price) * Number(item.quantity);

            total += itemTotal;

            const row = document.createElement("div");

            row.className = "checkout-summary-item";

            // Weight show karne ke liye
            let weightText = "";

            if (item.weight === 0.25) {
                weightText = "250 Gram";
            }
            else if (item.weight === 0.5) {
                weightText = "Half KG";
            }
            else if (item.weight === 1) {
                weightText = "1 KG";
            }
            else if (item.weight) {
                weightText = item.weight + " KG";
            }

        row.innerHTML = `
        <span>
            <strong>${item.name}</strong>
            <br>
            <small>
        ${
            item.name.includes(" Pound") ||
            item.name.startsWith("Milky Bread") ||
            item.name.startsWith("Plain Bread") ||
            item.name === "Brown Bread" ||
            item.name === "Band" ||
            item.name === "Sheermal"
                ? `Quantity: ${item.quantity}`
                : `${weightText} × ${item.quantity}`
        }
    </small>
        </span>

        <strong>
            Rs. ${itemTotal.toLocaleString()}
        </strong>
    `;
            summary.appendChild(row);
        });

        totalElement.textContent =
            "Rs. " + total.toLocaleString();
    }


    /* =====================================================
    DELIVERY / PICK-UP
    ===================================================== */

    function toggleDeliveryAddress() {

        const deliveryBox =
            document.getElementById(
                "delivery-address-box"
            );


        const selectedType =
            document.querySelector(
                'input[name="orderType"]:checked'
            );


        if (!deliveryBox || !selectedType) {

            return;

        }


        if (
            selectedType.value ===
            "pickup"
        ) {

            deliveryBox.style.display =
                "none";

        }

        else {

            deliveryBox.style.display =
                "block";

        }

    }


    /* =====================================================
    ADD NEW ADDRESS
    ===================================================== */

    function addNewAddress() {

        const address =
            document.getElementById(
                "delivery-address"
            );


        if (!address) {

            return;

        }


        address.value = "";

        address.focus();


        const savedList =
            document.getElementById(
                "saved-address-list"
            );


        if (savedList) {

            savedList.innerHTML = `

                <label class="saved-address">

                    <input
                        type="radio"
                        name="savedAddress"
                        value="new"
                        checked
                    >

                    <span>
                        New address
                    </span>

                </label>

            `;

        }

    }


    /* =====================================================
    PLACE ORDER
    ===================================================== */

   async function placeOrder() {
        if (cart.length === 0) {

            alert(
                "Your cart is empty."
            );

            return;

        }


        const name =
            document.getElementById(
                "customer-name"
            )?.value.trim();


        const phone =
            document.getElementById(
                "customer-phone"
            )?.value.trim();


        const alternatePhone =
            document.getElementById(
                "alternate-phone"
            )?.value.trim();


        const email =
            document.getElementById(
                "customer-email"
            )?.value.trim();


        const address =
            document.getElementById(
                "delivery-address"
            )?.value.trim();


        const landmark =
            document.getElementById(
                "landmark"
            )?.value.trim();


        const selectedType =
            document.querySelector(
                'input[name="orderType"]:checked'
            );


        const orderType =
            selectedType
                ? selectedType.value
                : "delivery";


        /* Name */

        if (!name) {

            alert(
                "Please enter your full name."
            );

            return;

        }


        /* Phone */

        if (!phone) {

            alert(
                "Please enter your mobile number."
            );

            return;

        }


        /* Delivery address */

        if (
            orderType === "delivery"
            &&
            !address
        ) {

            alert(
                "Please enter your delivery address."
            );

            return;

        }


        /* Calculate total */

        let total = 0;


        cart.forEach((item) => {

            total +=
                item.price *
                item.quantity;

        });


        /* Create order */

        currentOrder = {

            orderNumber:
                "ISH-" +
                Date.now()
                    .toString()
                    .slice(-6),

            date:
                new Date()
                    .toLocaleString(),

            customer: {

                name: name,

                phone: phone,

                alternatePhone:
                    alternatePhone,

                email: email

            },

            orderType:
                orderType,

            address:
                orderType === "delivery"
                    ? address
                    : "",

            landmark:
                landmark,

            paymentMethod:
                "Cash on Delivery",

            items:
                cart,

            total:
                total

        };


        localStorage.setItem(
            "iqbalOrder",
            JSON.stringify(
                currentOrder
            )
        );
        try {

   const firebaseOrder = JSON.parse(JSON.stringify({
    orderNumber: currentOrder.orderNumber,
    date: currentOrder.date,

    name: currentOrder.customer.name,
    phone: currentOrder.customer.phone,
    alternatePhone: currentOrder.customer.alternatePhone || "",
    email: currentOrder.customer.email || "",

    orderType: currentOrder.orderType,
    address: currentOrder.address || "",
    landmark: currentOrder.landmark || "",
    paymentMethod: currentOrder.paymentMethod,

    items: currentOrder.items,
    total: Number(currentOrder.total),

    status: "New"
}));

firebaseOrder.createdAt =
    window.firebaseServerTimestamp();

    await window.firebaseAddDoc(
        window.firebaseCollection(
            window.firebaseDB,
            "orders"
        ),
        firebaseOrder
    );

}
catch (error) {

   console.error(
    "Firebase order save failed:",
    error.code,
    error.message
);

    alert(
        "Order could not be saved. Please try again."
    );

    return;
}   
        if (typeof gtag === "function") {
    gtag("event", "purchase", {
        transaction_id: currentOrder.orderNumber,
        currency: "PKR",
        value: currentOrder.total,
        items: currentOrder.items.map(item => ({
            item_name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
        }))
    });
}


        /* Clear cart after order */

        cart = [];


        saveCart();


        /* Go to success page */

        window.location.href =
            "order-success.html";

    }


    /* =====================================================
    ORDER SUCCESS PAGE
    ===================================================== */

    function renderOrderSuccess() {

        const order =
            JSON.parse(
                localStorage.getItem("iqbalOrder")
            );


        if (!order) {
            return;
        }


        const orderNumber =
            document.getElementById(
                "success-order-number"
            );

        const customerName =
            document.getElementById(
                "success-customer-name"
            );

        const customerPhone =
            document.getElementById(
                "success-customer-phone"
            );

        const alternatePhone =
            document.getElementById(
                "success-alternate-phone"
            );

        const email =
            document.getElementById(
                "success-email"
            );

        const orderType =
            document.getElementById(
                "success-order-type"
            );

        const paymentMethod =
            document.getElementById(
                "success-payment-method"
            );

        const address =
            document.getElementById(
                "success-address"
            );

        const landmark =
            document.getElementById(
                "success-landmark"
            );

        const total =
            document.getElementById(
                "success-total"
            );

        const successItems =
            document.getElementById(
                "success-items"
            );


        /* Order Number */

        if (orderNumber) {

            orderNumber.textContent =
                order.orderNumber;

        }


        /* Customer */

        if (customerName) {

            customerName.textContent =
                order.customer.name || "-";

        }


        if (customerPhone) {

            customerPhone.textContent =
                order.customer.phone || "-";

        }


        if (alternatePhone) {

            alternatePhone.textContent =
                order.customer.alternatePhone || "-";

        }


        if (email) {

            email.textContent =
                order.customer.email || "-";

        }


        /* Order Type */

        if (orderType) {

            orderType.textContent =
                order.orderType === "pickup"
                    ? "Pick-up"
                    : "Delivery";

        }


        /* Payment */

        if (paymentMethod) {

            paymentMethod.textContent =
                order.paymentMethod ||
                "Cash on Delivery";

        }


        /* Address */

        if (address) {

            address.textContent =
                order.orderType === "pickup"
                    ? "Not required for Pick-up"
                    : (order.address || "-");

        }


        /* Landmark */

        if (landmark) {

            landmark.textContent =
                order.landmark || "-";

        }


        /* Total */

        if (total) {

            total.textContent =
                "Rs. " +
                order.total.toLocaleString();

        }

    /* Items */

    if (successItems) {

        successItems.innerHTML = "";

        order.items.forEach((item) => {

            const row =
                document.createElement("div");

            row.className =
                "checkout-summary-item";

            const itemTotal =
                Number(item.price) *
                Number(item.quantity);

            /* Weight */

            let weightText = "";

            if (item.weight === 0.25) {
                weightText = "250 Gram";
            }
            else if (item.weight === 0.5) {
                weightText = "Half KG";
            }
            else if (item.weight === 1) {
                weightText = "1 KG";
            }
            else if (item.weight) {
                weightText = item.weight + " KG";
            } 
            if (
        item.name.includes(" Pound") ||
        item.name.startsWith("Milky Bread") ||
        item.name.startsWith("Plain Bread") ||
        item.name === "Brown Bread" ||
        item.name === "Band" ||
        item.name === "Sheermal"
    ) {
        weightText = "";
    }

            row.innerHTML = `

                <span>
                    <strong>${item.name}</strong>
                    <br>
                    <small>
                    <small>
        ${
            item.name.includes(" Pound") ||
            item.name.startsWith("Milky Bread") ||
            item.name.startsWith("Plain Bread") ||
            item.name === "Brown Bread" ||
            item.name === "Band" ||
            item.name === "Sheermal"
                ? `Quantity: ${item.quantity}`
                : `${weightText} × ${item.quantity}`
        }
    </small>
                    </small>
                </span>

                <strong>
                    Rs. ${itemTotal.toLocaleString()}
                </strong>

            `;

            successItems.appendChild(row);

        });

    }
    }


    /* =====================================================
    PAGE STARTUP
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            updateCartCount();

            renderCartPage();

            renderCheckout();

            toggleDeliveryAddress();

            renderOrderSuccess();

        }
    );
    /* =====================================================
    SEND ORDER AGAIN ON WHATSAPP
    ===================================================== */

    function sendOrderToWhatsApp() {

        const order =
            JSON.parse(
                localStorage.getItem("iqbalOrder")
            );

        if (!order) {

            alert("Order information not found.");

            return;

        }


        let message =
            "🍬 *IQBAL SWEET HOUSE ORDER*%0A%0A";


        message +=
            "*Order No:* " +
            order.orderNumber +
            "%0A";


        message +=
            "*Customer:* " +
            order.customer.name +
            "%0A";


        message +=
            "*Mobile:* " +
            order.customer.phone +
            "%0A";


        if (order.customer.alternatePhone) {

            message +=
                "*Alternate Mobile:* " +
                order.customer.alternatePhone +
                "%0A";

        }


        if (order.customer.email) {

            message +=
                "*Email:* " +
                order.customer.email +
                "%0A";

        }


        message +=
            "*Order Type:* " +
            (
                order.orderType === "pickup"
                    ? "Pick-up"
                    : "Delivery"
            ) +
            "%0A";


        if (order.orderType === "delivery") {

            message +=
                "*Address:* " +
                order.address +
                "%0A";

        }


        if (order.landmark) {

            message +=
                "*Landmark:* " +
                order.landmark +
                "%0A";

        }


        message +=
            "*Payment:* Cash on Delivery%0A%0A";


        message +=
            "*ORDER ITEMS:*%0A";

    order.items.forEach((item) => {
        const itemTotal =
            item.price *
            item.quantity;

        let weightText = "";

        if (item.weight === 0.25) {
            weightText = "250 Gram";
        }
        else if (item.weight === 0.5) {
            weightText = "Half KG";
        }
        else if (item.weight === 1) {
            weightText = "1 KG";
        }
        else if (item.weight) {
            weightText = item.weight + " KG";
        }

        const isCakeOrBread =
            item.name.includes(" Pound") ||
            item.name.startsWith("Milky Bread") ||
            item.name.startsWith("Plain Bread") ||
            item.name === "Brown Bread" ||
            item.name === "Band" ||
            item.name === "Sheermal";

        message +=
            "• " +
            item.name +
            " - " +
            (
                isCakeOrBread
                    ? "Quantity: " + item.quantity
                    : weightText + " × " + item.quantity
            ) +
            " = Rs. " +
            itemTotal.toLocaleString() +
            "%0A";
    });


        message +=
            "%0A*TOTAL: Rs. " +
            order.total.toLocaleString() +
            "*";


        const whatsappNumber =
            "923120606806";


        const whatsappURL =
            "https://wa.me/" +
            whatsappNumber +
            "?text=" +
            message;


        window.open(
            whatsappURL,
            "_blank"
        );

    }
    /* =====================================================
    CAKE SIZE SELECTION
    ===================================================== */

    let selectedCake = {
        name: "",
        onePound: 0,
        twoPound: 0,
        image: ""
    };


    /* OPEN CAKE SIZE POPUP */

    function openCakeModal(name, onePound, twoPound, image) {

        selectedCake.name = name;
        selectedCake.onePound = onePound;
        selectedCake.twoPound = twoPound;
        selectedCake.image = image;

        const modal = document.getElementById("cake-size-modal");

        if (!modal) {
            return;
        }

        document.getElementById("cake-modal-name").textContent = name;

        document.getElementById("cake-modal-image").src = image;

        document.getElementById("cake-one-price").textContent =
            "Rs. " + onePound.toLocaleString();

        document.getElementById("cake-two-price").textContent =
            "Rs. " + twoPound.toLocaleString();

        modal.style.display = "flex";
    }


    /* CLOSE CAKE POPUP */

    function closeCakeModal() {

        const modal =
            document.getElementById("cake-size-modal");

        if (modal) {
            modal.style.display = "none";
        }

    }


    /* SELECT CAKE SIZE */

    function selectCakeSize(size) {

        if (!selectedCake.name) {
            return;
        }

        let price = 0;
        let sizeText = "";

        if (size === 1) {

            price = selectedCake.onePound;
            sizeText = "1 Pound";

        } else if (size === 2) {

            price = selectedCake.twoPound;
            sizeText = "2 Pound";

        } else {

            return;

        }


        /* Add cake to existing cart */

        addToCart(
            selectedCake.name + " - " + sizeText,
            price,
            selectedCake.image
        );


        /* Close popup */

        closeCakeModal();

    }
    /* =====================================================
    BREAD SIZE MODAL
    ===================================================== */

    let selectedBread = null;


    function openBreadModal(
        name,
        smallPrice,
        largePrice,
        image
    ) {

        const modal =
            document.getElementById("bread-size-modal");

        if (!modal) {
            return;
        }


        selectedBread = {
            name: name,
            smallPrice: Number(smallPrice),
            largePrice: Number(largePrice),
            image: image
        };


        const imageElement =
            document.getElementById("bread-modal-image");

        const nameElement =
            document.getElementById("bread-modal-name");

        const smallPriceElement =
            document.getElementById("bread-small-price");

        const largePriceElement =
            document.getElementById("bread-large-price");


        if (imageElement) {
            imageElement.src = image;
            imageElement.alt = name;
        }


        if (nameElement) {
            nameElement.textContent = name;
        }


        if (smallPriceElement) {
            smallPriceElement.textContent =
                "Rs. " +
                selectedBread.smallPrice.toLocaleString();
        }


        if (largePriceElement) {
            largePriceElement.textContent =
                "Rs. " +
                selectedBread.largePrice.toLocaleString();
        }


        modal.style.display = "flex";

        document.body.style.overflow = "hidden";
    }


    function closeBreadModal() {

        const modal =
            document.getElementById("bread-size-modal");

        if (modal) {
            modal.style.display = "none";
        }


        selectedBread = null;

        document.body.style.overflow = "";
    }


    function selectBreadSize(size) {

        if (!selectedBread) {
            return;
        }


        let price;

        let productName;


        if (size === "Small") {

            price = selectedBread.smallPrice;

            productName =
                selectedBread.name + " - Small";

        }

        else if (size === "Large") {

            price = selectedBread.largePrice;

            productName =
                selectedBread.name + " - Large";

        }

        else {

            return;

        }


        addToCart(
            productName,
            price,
            selectedBread.image
        );


        closeBreadModal();
    }


    /* Close Bread Modal by clicking outside */

    document.addEventListener(
        "click",
        function (event) {

            const breadModal =
                document.getElementById(
                    "bread-size-modal"
                );

            if (
                breadModal &&
                event.target === breadModal
            ) {
                closeBreadModal();
            }

        }
    );
