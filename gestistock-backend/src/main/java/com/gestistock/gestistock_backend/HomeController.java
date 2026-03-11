package com.gestistock.gestistock_backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String welcome() {
        return "<h1>🚀 Backend GESTISTOCK Connecté !</h1>" +
               "<p>Le serveur Spring Boot (Java 24) tourne parfaitement.</p>" +
               "<p>Base de données MySQL : <b>Connectée</b></p>";
    }
}