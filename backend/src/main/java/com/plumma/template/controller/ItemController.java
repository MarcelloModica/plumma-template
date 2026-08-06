package com.plumma.template.controller;

import com.plumma.template.dto.CreateItemRequest;
import com.plumma.template.dto.ItemDto;
import com.plumma.template.dto.UpdateItemRequest;
import com.plumma.template.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * CRUD di esempio, protetto da JWT ({@code /api/**}). Sostituiscilo con i tuoi
 * endpoint di dominio.
 */
@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public List<ItemDto> list() {
        return itemService.list();
    }

    @GetMapping("/{id}")
    public ItemDto get(@PathVariable final Long id) {
        return itemService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemDto create(@Valid @RequestBody final CreateItemRequest request) {
        return itemService.create(request);
    }

    @PutMapping("/{id}")
    public ItemDto update(@PathVariable final Long id, @Valid @RequestBody final UpdateItemRequest request) {
        return itemService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable final Long id) {
        itemService.delete(id);
    }

}
