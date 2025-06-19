from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.pull_request import PullRequest

router = APIRouter(prefix="/api/pr", tags=["Pull Requests"])

@router.get("/{pr_node_id}")
def get_pull_request_details(pr_node_id: str, db: Session = Depends(get_db)):
    """
    根据 PR 的 Node ID 获取其详细信息和时间线事件。
    """
    pr = (
        db.query(PullRequest)
        .options(joinedload(PullRequest.events))
        .filter(PullRequest.pr_node_id == pr_node_id)
        .first()
    )
    
    if not pr:
        raise HTTPException(status_code=404, detail="Pull Request not found")
        
    # 对事件按时间升序排序
    if pr.events:
        pr.events.sort(key=lambda event: event.event_time)
        
    return pr.to_dict() 