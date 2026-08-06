package com.plumma.template.dto;

import com.plumma.template.entity.Item;

public record ItemDto(
        Long id,
        String name,
        String description,
        int quantity
) {

    public static ItemDto from(final Item item) {
        return new ItemDto(item.getId(), item.getName(), item.getDescription(), item.getQuantity());
    }

}
