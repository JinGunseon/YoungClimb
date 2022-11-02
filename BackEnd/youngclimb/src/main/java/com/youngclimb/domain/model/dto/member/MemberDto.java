package com.youngclimb.domain.model.dto.member;

import com.youngclimb.domain.model.dto.board.BoardDto;
import lombok.Data;

import java.util.List;

@Data
public class MemberDto {
    boolean isfollow;
    UserDto user;
    List<BoardDto> boards;

}