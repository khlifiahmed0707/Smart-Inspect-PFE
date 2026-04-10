const formData = {
    nom: "Dupont",
    prenom: "Jean",
    email: "test.submit@gmail.com",
    password: "123",
    numeroCarteIdentite: "00000000",
    enabled: true
};

async function testFetch() {
    try {
        console.log("Sending POST to http://192.168.1.21:8081/api/personnes");
        const response = await fetch("http://192.168.1.21:8081/api/personnes", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        console.log("Response OK?", response.ok);
        if (response.ok) {
            const data = await response.json();
            console.log("Success! Data:", data);

            // cleanup
            await fetch("http://192.168.1.21:8081/api/personnes/test.submit@gmail.com", { method: 'DELETE' });
        } else {
            console.log("Error status:", response.status);
            const text = await response.text();
            console.log("Error text:", text);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testFetch();
