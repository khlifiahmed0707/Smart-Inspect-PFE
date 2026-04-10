package com.example.demo.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class PersonneId implements Serializable {

    private String email;
    private String numeroCarteIdentite;

    public PersonneId() {}

    public PersonneId(String email, String numeroCarteIdentite) {
        this.email = email;
        this.numeroCarteIdentite = numeroCarteIdentite;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNumeroCarteIdentite() {
        return numeroCarteIdentite;
    }

    public void setNumeroCarteIdentite(String numeroCarteIdentite) {
        this.numeroCarteIdentite = numeroCarteIdentite;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PersonneId that = (PersonneId) o;
        return Objects.equals(email, that.email) && 
               Objects.equals(numeroCarteIdentite, that.numeroCarteIdentite);
    }

    @Override
    public int hashCode() {
        return Objects.hash(email, numeroCarteIdentite);
    }
}
