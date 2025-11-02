package org.arfath.helpdeskbackend.controller;

import lombok.RequiredArgsConstructor;
import org.arfath.helpdeskbackend.service.AiService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/v1/helpdesk")
@RequiredArgsConstructor
@CrossOrigin("http://localhost:5173")
public class AiController {
    private  final AiService service;

    @PostMapping
    public ResponseEntity<String > getResponse(@RequestBody String query, @RequestHeader("ConversationId") String conversationId){
        return ResponseEntity.ok(service.getResponseFromAssistant(query,conversationId));
    }


    @PostMapping(value = "/stream")
    public Flux<String> streamResponse(@RequestBody  String query, @RequestHeader("ConversationId") String conversationId){
        return this.service.streamResponseFromAssistant(query,conversationId) ;
    }
}
