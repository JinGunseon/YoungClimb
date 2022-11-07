package com.youngclimb.domain.model.service;

import com.youngclimb.domain.model.dto.board.BoardCreate;
import com.youngclimb.domain.model.dto.board.BoardDetailDto;
import com.youngclimb.domain.model.dto.board.CommentCreate;
import com.youngclimb.common.security.UserPrincipal;
import com.youngclimb.domain.model.dto.board.BoardDto;
import com.youngclimb.domain.model.dto.member.MemberDto;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// userid 혹은 email을 받는 친구들은 모두 @currentUser로 바꿀 예정
// 일단 login 될 때까지만 임시로 사용
public interface BoardService {
    // 전체 게시글 조회
    public List<BoardDto> readAllBoard(String userId, Pageable pageable, UserPrincipal currUser);
    // 게시물 작성
    public void writeBoard(BoardCreate boardCreate, MultipartFile file);
    // 게시글 좋아요
    public Boolean boardLikeCancle(Long boardId, String email);
    // 게시글 댓글 조회
    public BoardDetailDto readAllComments(Long boardId, Long memberId);
    // 댓글 좋아요/취소
    public Boolean commentLikeCancle(Long commentId, String email);
    // 게시글 신고

    // 댓글 작성
    public void writeComment(CommentCreate commentCreate);
    // 대댓글 작성
    public void writeRecomment(CommentCreate commentCreate);
    // 게시글 스크랩/취소
    public Boolean boardScrapCancle(Long boardId, String email);
    // 게시글 검색

    // 사용자 정보 조회
    public MemberDto getUserInfoByUserId(String userId, String loginEmail);

    // 게시글 신고하기
    public Boolean boardReport(Long boardId, String content, String email);

}
