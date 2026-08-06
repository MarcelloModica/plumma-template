package com.plumma.template.service;

import com.plumma.template.dto.CreateItemRequest;
import com.plumma.template.dto.ItemDto;
import com.plumma.template.dto.UpdateItemRequest;
import com.plumma.template.entity.Item;
import com.plumma.template.exception.NotFoundException;
import com.plumma.template.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;

    @Transactional(readOnly = true)
    public List<ItemDto> list() {
        return itemRepository.findAll().stream().map(ItemDto::from).toList();
    }

    @Transactional(readOnly = true)
    public ItemDto get(final Long id) {
        return ItemDto.from(findOrThrow(id));
    }

    @Transactional
    public ItemDto create(final CreateItemRequest request) {
        final Item item = new Item();
        item.setName(request.name());
        item.setDescription(request.description());
        item.setQuantity(request.quantity());
        return ItemDto.from(itemRepository.save(item));
    }

    @Transactional
    public ItemDto update(final Long id, final UpdateItemRequest request) {
        final Item item = findOrThrow(id);
        item.setName(request.name());
        item.setDescription(request.description());
        item.setQuantity(request.quantity());
        return ItemDto.from(itemRepository.save(item));
    }

    @Transactional
    public void delete(final Long id) {
        final Item item = findOrThrow(id);
        itemRepository.delete(item);
    }

    private Item findOrThrow(final Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Item " + id + " non trovato"));
    }

}
